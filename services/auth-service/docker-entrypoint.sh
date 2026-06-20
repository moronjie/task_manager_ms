#!/bin/sh
set -e

# Sync the Prisma schema to Postgres (idempotent). db push avoids needing a
# committed migration history, which keeps this demo simple. Retry a few times
# in case Postgres is still accepting its first connections.
echo "[auth] syncing database schema..."
attempt=1
max=10
until npx prisma db push --skip-generate; do
  if [ "$attempt" -ge "$max" ]; then
    echo "[auth] schema sync failed after $max attempts, giving up"
    exit 1
  fi
  echo "[auth] schema sync failed (attempt $attempt/$max), retrying in 3s..."
  attempt=$((attempt + 1))
  sleep 3
done

echo "[auth] starting service..."
exec node dist/index.js
