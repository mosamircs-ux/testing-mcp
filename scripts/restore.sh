#!/bin/bash
# ============================================================================
# NovaQA PostgreSQL Disaster Recovery Database Restore Script
# ============================================================================
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path-to-backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# Verify checksum if available
if [ -f "${CHECKSUM_FILE}" ]; then
  echo "[$(date)] 🔍 Verifying backup integrity via SHA256 checksum..."
  sha256sum -c "${CHECKSUM_FILE}"
fi

DB_NAME="${POSTGRES_DB:-novaqa_production}"
DB_USER="${POSTGRES_USER:-novaqa_admin}"
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"

read -p "⚠️ WARNING: Restoring will overwrite existing data in database '${DB_NAME}'. Type 'CONFIRM' to proceed: " CONFIRM_TEXT
if [ "${CONFIRM_TEXT}" != "CONFIRM" ]; then
  echo "Operation cancelled by user."
  exit 0
fi

echo "[$(date)] 🔄 Restoring database '${DB_NAME}' from ${BACKUP_FILE}..."

gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}"

echo "[$(date)] ✅ Database restore completed successfully."
