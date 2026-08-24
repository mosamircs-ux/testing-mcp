# Production Backup & Retention Strategy

This document outlines NovaQA's automated backup strategy, retention schedule, offsite storage replication, and disaster recovery testing drills.

---

## 📅 1. Backup Schedule & RPO/RTO Targets

| Tier | Frequency | Retention Period | Target RPO | Target RTO |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Hourly Snapshots & Daily Dumps | 30 Days Local, 90 Days S3 | < 1 Hour | < 15 Minutes |
| **Test Artifacts & Videos** | Real-time Object Storage Sync | Plan-Based (7 to 365 Days) | 0 (Immediate) | < 5 Minutes |
| **Audit Logs** | Real-time Append | 365 Days Immutable | 0 (Immediate) | < 5 Minutes |

---

## ⚙️ 2. Automated Daily Cron Backup Setup

Configure on the host system via `crontab -e`:

```cron
# Run automated database backup every 6 hours at minute 0
0 */6 * * * /app/scripts/backup.sh >> /var/log/novaqa-backup.log 2>&1

# Sync backups offsite to secondary S3 bucket daily at 03:00 UTC
0 3 * * * aws s3 sync /backups s3://novaqa-dr-cold-storage/backups/ --delete
```

---

## 🧪 3. Monthly Disaster Recovery Drill

Every 30 days, the SRE team performs a non-destructive restoration drill:
1. Spin up an isolated staging database container.
2. Download the latest production backup from S3 cold storage.
3. Run `./scripts/restore.sh` into the staging container.
4. Execute test suite against restored database to verify record integrity.
