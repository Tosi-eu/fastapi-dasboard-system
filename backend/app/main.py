import asyncio
import pandas as pd
from prisma import Prisma
from typing import Optional
from datetime import datetime, time, date
from contextlib import asynccontextmanager
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
import re

from .utils import worker
from .security import SecurityService
from .schemas import MetricsResponse, LoginRequest, Token, UserCreate

security = SecurityService()

prisma_client = Prisma(use_dotenv=True)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

CHUNK_SIZE = 200
MAX_CONCURRENCY = 10
EMAIL_REGEX = r'^[\w\.-]+@[\w\.-]+\.\w+$'

@asynccontextmanager
async def lifespan(app: FastAPI):
    
    await prisma_client.connect()
    try:
        yield
    finally:
        await prisma_client.disconnect()

app = FastAPI(title="Case API - FastAPI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/login", response_model=Token)
async def login(req: LoginRequest):
    users = await prisma_client.user.find_many(where={"email": req.email})
    
    for user in users:
        if security.verify_password(req.password, user.password):
            token = security.create_access_token({"sub": f"{user.username}|{user.email}", "role": user.role})
            return {"access_token": token, "token_type": "bearer"}

    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/users", response_model=Token)
async def register(req: UserCreate):

    if not re.match(EMAIL_REGEX, req.email):
        raise HTTPException(status_code=400, detail="Email inválido. Formato esperado: usuario@dominio.com")

    hashed = security.get_password_hash(req.password)

    try:
        user = await prisma_client.user.create(
            data={
                "email": req.email,
                "username": req.username,
                "password": hashed,
                "role": "user"
            }
        )

        await prisma_client.existents.create(
            data={
                "email": req.email,
                "username": req.username
            }
        )

        token = security.create_access_token({
            "sub": f"{user.username}|{user.email}",
            "role": user.role
        })

        return {"access_token": token, "token_type": "bearer"}

    except Exception as e:
        match = re.search(r'message: "([^"]+)"', str(e))
        if match:
            raise HTTPException(status_code=400, detail=match.group(1))
        raise HTTPException(status_code=500, detail="Erro inesperado ao criar usuário")

async def process_metrics_chunk(chunk, now):
    data = [
        {
            "date": datetime.strptime(str(row["date"]), "%Y-%m-%d"),
            "account_id": int(row["account_id"]),
            "campaign_id": int(row["campaign_id"]),
            "cost_micros": float(row["cost_micros"]) if not pd.isna(row["cost_micros"]) else None,
            "clicks": float(row["clicks"]),
            "conversions": float(row["conversions"]),
            "impressions": float(row["impressions"]),
            "interactions": float(row["interactions"]),
            "createdAt": now,
            "updatedAt": now,
        }
        for _, row in chunk.iterrows()
    ]

    if data:
        await prisma_client.metric.create_many(data=data, skip_duplicates=True)
    return len(data)


async def process_users_chunk(chunk):
    data = [
        {
            "username": row["username"],
            "email": row["email"],
            "password": security.get_password_hash(row["password"]),
            "role": row["role"],
        }
        for _, row in chunk.iterrows()
    ]

    data_copy = [
        {
            "username": row["username"],
            "email": row["email"],
        }
        for _, row in chunk.iterrows()
    ]

    created_users = []
    if data:
        await prisma_client.user.create_many(data=data, skip_duplicates=True)
        await prisma_client.existents.create_many(data=data_copy, skip_duplicates=True)

        created_users = await prisma_client.user.find_many(
            where={"OR": [{"username": d["username"], "email": d["email"]} for d in data]}
        )
    return data, created_users

@app.post("/populate")
async def populate(
    file: UploadFile = File(...),
    target: str = Query(..., regex="^(users|metrics)$")
):
    rows = 0
    now = datetime.now()
    tokens = None

    try:
        semaphore = asyncio.Semaphore(MAX_CONCURRENCY)
        tasks = []

        for chunk in pd.read_csv(file.file, chunksize=CHUNK_SIZE):
            if target == "metrics":
                tasks.append(worker(semaphore, process_metrics_chunk, chunk, now))
            elif target == "users":
                tasks.append(worker(semaphore, process_users_chunk, chunk))

        results = await asyncio.gather(*tasks)

        if target == "metrics":
            rows = sum(results)
        elif target == "users":
            all_data = []
            all_users = []
            for data, users in results:
                all_data.extend(data)
                all_users.extend(users)
            rows = len(all_data)

            tokens = [
                {
                    "username": u.username,
                    "email": u.email,
                    "access_token": security.create_access_token(
                        {"sub": f"{u.username}|{u.email}", "role": u.role}
                    ),
                }
                for u in all_users
            ]

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing CSV: {e}")

    return {
        "status": "success",
        "rows": rows,
        "target": target,
        "tokens": tokens if target == "users" else None,
    }

@app.get("/metrics", response_model=MetricsResponse)
async def list_metrics(
    page: int = 1,
    page_size: int = 20,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by: Optional[str] = None,
    order: str = "asc"
):
    skip = (page - 1) * page_size
    take = page_size

    where = {}
    if start_date or end_date:
        where["date"] = {}
        if start_date:
            where["date"]["gte"] = datetime.combine(start_date, time.min)
        if end_date:
            where["date"]["lte"] = datetime.combine(end_date, time.max)

    order_by = {sort_by: order.lower()} if sort_by else {"date": "desc"}

    total = await prisma_client.metric.count(where=where if where else None)
    metrics = await prisma_client.metric.find_many(
        where=where if where else None,
        order=order_by,
        skip=skip,
        take=take,
    )

    metrics_serialized = []
    for m in metrics:
        m_dict = m.model_dump()
        if isinstance(m_dict.get("date"), datetime):
            m_dict["date"] = m_dict["date"].strftime("%Y-%m-%d %H:%M:%S")
        metrics_serialized.append(m_dict)

    return {
        "data": metrics_serialized,
        "pagination": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size,
        }
    }

@app.get("/")
async def root():
    return {"message": "Case API - FastAPI up and running"}
