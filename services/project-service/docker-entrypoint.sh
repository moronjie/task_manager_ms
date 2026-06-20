#!/bin/sh
set -e

# Sync the Prisma schema to Postgres (idempotent). Retry a few times in case
# Postgres is still accepting its first connections.
echo "[project] syncing database schema..."
attempt=1
max=10
until npx prisma db push --skip-generate; do
  if [ "$attempt" -ge "$max" ]; then
    echo "[project] schema sync failed after $max attempts, giving up"
    exit 1
  fi
  echo "[project] schema sync failed (attempt $attempt/$max), retrying in 3s..."
  attempt=$((attempt + 1))
  sleep 3
done

echo "[project] starting service..."
exec node dist/index.js
