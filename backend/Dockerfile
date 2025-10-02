FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

RUN apt-get update && \
    apt-get install -y curl postgresql-client && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app /app/app
COPY backend/schema.prisma /app/schema.prisma
COPY backend/triggers.sql /app/triggers.sql
COPY backend/wait-for-it.sh /app/wait-for-it.sh
COPY backend/setup.sh /app/setup.sh
RUN chmod +x /app/wait-for-it.sh
RUN chmod +x /app/setup.sh

RUN python3 -m prisma generate

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
