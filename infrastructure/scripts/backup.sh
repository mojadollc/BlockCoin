#!/usr/bin/env bash
# backup.sh — PostgreSQL backup + optional S3 upload
# Cron: 0 2 * * * /opt/blockcoin/infrastructure/scripts/backup.sh >> /var/log/blockcoin-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="/var/backups/blockcoin"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/blockcoin_$TIMESTAMP.sql.gz"
KEEP_DAYS=7

# Load env
source /opt/blockcoin/.env 2>/dev/null || true

DB_URL="${DATABASE_URL:-}"
S3_BUCKET="${BACKUP_S3_BUCKET:-}"

if [ -z "$DB_URL" ]; then
  echo "[backup] ERROR: DATABASE_URL not set"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting backup at $(date)"

# Extract connection params from DATABASE_URL
# Format: postgresql://user:pass@host:port/dbname
DB_USER=$(echo "$DB_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DB_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_HOST=$(echo "$DB_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DB_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$DB_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  | gzip > "$BACKUP_FILE"

echo "[backup] Backup written: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ] && command -v aws &>/dev/null; then
  aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/$(basename "$BACKUP_FILE")"
  echo "[backup] Uploaded to s3://$S3_BUCKET"
fi

# Remove old backups
find "$BACKUP_DIR" -name "blockcoin_*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "[backup] Cleaned backups older than $KEEP_DAYS days"
echo "[backup] Done at $(date)"
