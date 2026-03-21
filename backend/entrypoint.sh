#!/usr/bin/env sh
set -e

echo "==> Esperando base de datos..."
sleep 3

echo "==> Ejecutando migraciones..."
alembic upgrade head

echo "==> Insertando datos base (roles + categorías)..."
python -m app.utils.seed_data || true

echo "==> Iniciando API EcoMarket..."
uvicorn app.main:app --host 0.0.0.0 --port 8000
