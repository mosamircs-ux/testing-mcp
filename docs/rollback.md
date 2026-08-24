# Production Rollback & Recovery Procedures

This guide provides step-by-step instructions for performing an emergency rollback of application code, container images, or database schema changes.

---

## ⏪ 1. Fast Container Rollback (Code / API / Web)

If a new deployment introduces errors or latency spikes:

```bash
# 1. Roll back to the previous stable release tag
git checkout v2.3.9

# 2. Re-build and restart containers
docker compose -f docker-compose.production.yml build api web worker
docker compose -f docker-compose.production.yml up -d --no-deps api web worker

# 3. Verify health
curl -f http://localhost:4000/health/ready
```

---

## 🗄️ 2. Database Migration Rollback

When schema migrations require manual down-migrations:

```bash
# 1. Access the API container CLI
docker compose -f docker-compose.production.yml exec api sh

# 2. Inspect migration status
npx prisma migrate status

# 3. Execute target down-migration SQL script if provided
psql $DATABASE_URL -f ./scripts/migrations/down/rollback_v2.4.0.sql
```

---

## 🚨 3. Emergency Disaster Recovery (Full Database Restore)

If database corruption or data loss occurs:

```bash
# 1. Stop background workers to halt writes
docker compose -f docker-compose.production.yml stop worker api

# 2. Execute automated restore script
./scripts/restore.sh /backups/novaqa_production_20260824_060000.sql.gz

# 3. Restart services
docker compose -f docker-compose.production.yml start api worker

# 4. Verify system integrity
curl -f http://localhost:4000/health/ready
```
