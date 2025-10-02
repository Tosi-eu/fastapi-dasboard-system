#!/bin/sh

set -e

echo "Aguardando banco de dados..."
./wait-for-it.sh db:5432 --timeout=30 --strict
echo "Banco de dados disponível!"

echo "Aplicando schema Prisma..."
python3 -m prisma db push
echo "Schema aplicado com sucesso!"

USERS_CSV=$(find ./ -type f -name "users.csv" | head -n 1)
METRICS_CSV=$(find ./ -type f -name "metrics.csv" | head -n 1)

if [ -z "$USERS_CSV" ] || [ -z "$METRICS_CSV" ]; then
  echo "Arquivos CSV não encontrados!"
  exit 1
fi

echo "CSV de usuários encontrado em: $USERS_CSV"
echo "CSV de métricas encontrado em: $METRICS_CSV"

echo "Iniciando backend..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
UVICORN_PID=$!

echo "Aguardando backend subir..."
until curl -s http://127.0.0.1:8000/ > /dev/null; do
  sleep 1
done
echo "Backend disponível!"

populate() {
  TARGET=$1
  FILE=$2
  TOTAL_ROWS=$(wc -l < "$FILE")
  echo "Populando $TARGET..."

  RESPONSE=$(curl -s -X POST -F "file=@$FILE" "http://127.0.0.1:8000/populate?target=$TARGET")
  ROWS_POPULATED=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['rows'])")
  PERCENT=$((ROWS_POPULATED * 100 / TOTAL_ROWS))

  echo "$TARGET: $ROWS_POPULATED/$TOTAL_ROWS ($PERCENT%) concluído"
}

populate "users" "$USERS_CSV"
populate "metrics" "$METRICS_CSV"

psql postgresql://admin:admin@db:5432/case_db -f /app/triggers.sql
echo 'Triggers aplicados com sucesso!'

echo "Setup inicial concluído!"

wait $UVICORN_PID