# NovaQA Production Deployment Guide

This document defines the production deployment architecture, prerequisites, container orchestration, and zero-downtime deployment workflows for the **NovaQA Autonomous AI Software Testing SaaS Platform**.

---

## 🏗️ 1. Architecture Overview

```
                                  [ Internet / Users / AI Agents ]
                                                 │
                                                 ▼
                             ┌───────────────────────────────────────┐
                             │       Nginx TLS Reverse Proxy         │
                             │  (Port 80 -> 443, HSTS, Rate Limits)  │
                             └───────────────┬───────────────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
       ┌───────────────────────────────┐             ┌───────────────────────────────┐
       │   Next.js SaaS Web Frontend   │             │   Express REST / WS API Engine│
       │    (Container: novaqa-web)    │             │    (Container: novaqa-api)    │
       └──────────────┬────────────────┘             └──────────────┬────────────────┘
                      │                                             │
                      └──────────────────────┬──────────────────────┘
                                             │  (Private Network: novaqa-internal)
                      ┌──────────────────────┼──────────────────────┐
                      ▼                      ▼                      ▼
       ┌────────────────────────┐ ┌────────────────────┐ ┌─────────────────────────┐
       │ PostgreSQL 16 Cluster  │ │   Redis 7 (Queue)  │ │ MinIO S3 Object Storage │
       │ (novaqa-postgres:5432) │ │ (novaqa-redis:6379)│ │ (novaqa-minio:9000)     │
       └────────────────────────┘ └──────────┬─────────┘ └─────────────────────────┘
                                             │
                                             ▼
                             ┌───────────────────────────────────────┐
                             │  Background Execution Worker Grid     │
                             │  (Playwright Headless Chrome/Firefox) │
                             │      (Container: novaqa-worker)       │
                             └───────────────────────────────────────┘
```

---

## 🚀 2. Production Deployment Steps

### Step 1: Provision Host Server
- **Recommended Spec**: 4 vCPU, 16 GB RAM, 100 GB NVMe SSD (Ubuntu 22.04 LTS or 24.04 LTS).
- **Installed Packages**: Docker Engine 24+, Docker Compose 2+, OpenSSL.

### Step 2: Configure Environment Secrets
```bash
cp .env.production.example .env.production
# Edit and populate cryptographically strong secrets
chmod 600 .env.production
```

### Step 3: SSL / TLS Certificate Provisioning
Place your SSL certificates in `./certs`:
- `./certs/fullchain.pem`
- `./certs/privkey.pem`

*(For Let's Encrypt automated renewal, use Certbot with the webroot plugin mapped to `./certbot/www`)*.

### Step 4: Launch the Production Stack
```bash
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
```

### Step 5: Run Database Migrations & Initial Plan Seeding
```bash
docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy
docker compose -f docker-compose.production.yml exec api node -e "require('@novaqa/auth').billingService.seedDefaultPlans()"
```

### Step 6: Verify Service Health
```bash
# Check all container states
docker compose -f docker-compose.production.yml ps

# Query API health
curl -f http://localhost:4000/health/ready
curl -f http://localhost:4001/health
```

---

## 🔄 3. Zero-Downtime Rolling Update

```bash
# 1. Pull new release tag
git fetch --tags
git checkout v2.4.0

# 2. Build updated images
docker compose -f docker-compose.production.yml build api web worker

# 3. Apply non-breaking database migrations
docker compose -f docker-compose.production.yml exec api npx prisma migrate deploy

# 4. Rolling restart of API and Web
docker compose -f docker-compose.production.yml up -d --no-deps api web worker
```
