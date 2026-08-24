# Environment Configuration & Secret Management Guide

This document details all environment variables, sensitivity levels, and secret rotation schedules for **NovaQA**.

---

## 📋 1. Variable Specifications

| Variable | Description | Sensitivity | Default / Format |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | Low | `production` |
| `APP_URL` | Public web application URL | Low | `https://app.novaqa.io` |
| `DATABASE_URL` | PostgreSQL connection string | **CRITICAL** | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection URL with auth | **CRITICAL** | `redis://:pass@host:6379/0` |
| `JWT_SECRET` | 64-char cryptographic HMAC secret | **CRITICAL** | Base64 string |
| `JWT_EXPIRES_IN` | User session token expiry | Low | `7d` |
| `REFRESH_TOKEN_EXPIRES_IN` | Long-lived refresh token expiry | Low | `30d` |
| `PAYMOB_API_KEY` | Paymob Live API Secret Key | **CRITICAL** | `sec_live_...` |
| `PAYMOB_HMAC_SECRET` | Webhook verification HMAC secret | **CRITICAL** | Hex string |
| `STORAGE_ENDPOINT` | S3 / MinIO Object storage URL | Low | `http://minio:9000` |
| `STORAGE_ACCESS_KEY` | S3 API access key | High | Alphanumeric |
| `STORAGE_SECRET_KEY` | S3 API secret key | **CRITICAL** | Alphanumeric |
| `MAX_CONCURRENT_RUNS`| Max parallel Playwright browsers | Low | `8` to `32` |
| `OPENAI_API_KEY` | OpenAI API Key for AI engine | **CRITICAL** | `sk-proj-...` |
| `ANTHROPIC_API_KEY` | Anthropic API Key for AI engine | **CRITICAL** | `sk-ant-...` |

---

## 🔐 2. Secret Generation & Rotation

### Generate Cryptographically Strong Secrets
```bash
# JWT Secret
openssl rand -base64 64

# Database & Redis Passwords
openssl rand -hex 32

# Storage Keys
openssl rand -hex 24
```

### Rotation Procedures
1. **JWT Secret Rotation**: Support dual-secret verification during transition (old secret for decoding existing tokens, new secret for signing newly issued tokens) for a 7-day grace window.
2. **Paymob HMAC Rotation**: Update webhook HMAC secret simultaneously in Paymob Dashboard and NovaQA `.env.production`, followed by a zero-downtime rolling restart of `api`.
