from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"

class Metric(BaseModel):
    date: date
    account_id: int
    campaign_id: int
    cost_micros: Optional[float]
    clicks: float
    conversions: float
    impressions: float
    interactions: float

class Pagination(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int

class MetricsResponse(BaseModel):
    data: List[Metric]
    pagination: Pagination