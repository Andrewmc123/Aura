#!/usr/bin/env sh
# Container start script for Render (and any Docker host).
# Runs DB migrations every boot (idempotent), optionally seeds demo data,
# then starts gunicorn.
set -e

# Without a real database URL fall back to a throwaway SQLite file so the
# container still boots (demo mode — nothing is saved between deploys).
if [ -z "$DATABASE_URL" ]; then
  echo "==> WARNING: DATABASE_URL is not set — using a temporary SQLite database."
  echo "==>          Data will be lost on the next deploy or restart."
  export DATABASE_URL="sqlite:////var/www/prod.db"
fi

echo "==> Running database migrations"
flask db upgrade

# Demo content (fake users, posts, products) is seeded:
#   * automatically on the throwaway SQLite database, so a demo isn't empty
#   * on a real database ONLY when SEED_DEMO_DATA=true
# A real launch database should start clean, so leave SEED_DEMO_DATA unset.
case "$DATABASE_URL" in
  sqlite*) SEED_DEFAULT=true ;;
  *)       SEED_DEFAULT=false ;;
esac

if [ "${SEED_DEMO_DATA:-$SEED_DEFAULT}" = "true" ]; then
  if python seed_if_empty.py; then
    echo "==> Empty database detected — seeding demo content"
    flask seed all
  else
    echo "==> Database already has content — skipping seed"
  fi
else
  echo "==> Demo seeding is off"
fi

echo "==> Starting gunicorn"
exec gunicorn app:app --bind "0.0.0.0:${PORT:-8000}" --workers 2 --threads 4 --timeout 120
