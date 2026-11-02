#!/usr/bin/env bash
# restore.sh — Restore PostgreSQL from backup
# Usage: bash infrastructure/scripts/restore.sh /var/backups/blockcoin/blockcoin_20240101_020000.sql.gz
set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

source /opt/blockcoin/.env 2>/dev/null || true
DB_URL="${DATABASE_URL:-}"

if [ -z "$DB_URL" ]; then
  echo "ERROR: DATABASE_URL not set"
  exit 1
fi

DB_USER=$(echo "$DB_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

echo "==> Restoring from $BACKUP_FILE to $DB_NAME..."
echo "==> WARNING: This will overwrite the current database. Ctrl+C to abort."
sleep 5

pm2 stop all 2>/dev/null || true

PGPASSWORD="$DB_PASS" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -c "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME;"

gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASS" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME"

pm2 start all 2>/dev/null || true

echo "==> Restore complete."
