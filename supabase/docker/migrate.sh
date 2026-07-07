#!/bin/sh
set -e

echo "Waiting for GoTrue schema (auth.users) to be ready..."
attempts=0
until psql "$DATABASE_URL" -c "SELECT 1 FROM auth.users LIMIT 1" >/dev/null 2>&1; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge 30 ]; then
    echo "auth.users still missing after 30s — GoTrue probably failed to start." >&2
    echo "Check 'docker compose logs auth' (common cause: missing/empty .env at repo root — run 'cp .env.example .env')." >&2
    exit 1
  fi
  sleep 1
done

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE IF NOT EXISTS public._app_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());"

for f in /migrations/*.sql; do
  name=$(basename "$f")
  already=$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM public._app_migrations WHERE name = '$name'")
  if [ "$already" = "1" ]; then
    echo "-> $name (skip, already applied)"
    continue
  fi
  echo "-> $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO public._app_migrations (name) VALUES ('$name');"
done

echo "Migrations applied."

echo "Ensuring default admin account exists..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /seed-admin.sql

echo "Reloading PostgREST schema cache..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "NOTIFY pgrst, 'reload schema';"

echo "Done."
