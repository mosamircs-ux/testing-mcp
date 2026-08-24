#!/bin/bash
# ============================================================================
# NovaQA Automated PostgreSQL & Artifacts Production Backup Script
# ============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${POSTGRES_DB:-novaqa_production}"
DB_USER="${POSTGRES_USER:-novaqa_admin}"
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] 📦 Starting PostgreSQL automated database backup for: ${DB_NAME}..."

# Export compressed pg_dump
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -F p \
  "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"

# Calculate SHA256 verification checksum
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"

FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] ✅ Backup successfully completed: ${BACKUP_FILE} (Size: ${FILESIZE})"

# Prune backups older than 30 days
echo "[$(date)] 🧹 Pruning local backups older than 30 days..."
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +30 -delete
find "${BACKUP_DIR}" -type f -name "*.sha256" -mtime +30 -delete

echo "[$(date)] 🚀 Backup cycle completed successfully."
