# SRE Incident Response Runbook & Emergency Playbooks

This runbook guides on-call engineers through detection, triage, mitigation, and post-mortem workflows for **NovaQA**.

---

## 🚨 1. Severity Definitions & Escalation Matrix

| Severity | Definition | Notification SLA | Response Team |
| :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Core API down, payments failing, or tenant isolation breach | < 5 Minutes | Lead Architect, Security Engineer, SRE On-Call |
| **SEV-2 (High)** | Worker execution grid stalled, AI triage service unavailable | < 15 Minutes | SRE On-Call, Backend Engineer |
| **SEV-3 (Medium)** | Flaky test auto-healing degraded, metrics reporting delay | < 2 Hours | QA Lead, Product Engineer |

---

## 🛠️ 2. Incident Playbooks

### Playbook A: PostgreSQL Connection Pool Exhaustion
1. **Symptoms**: API returns HTTP 503 on `/health/ready` with `Timed out fetching a connection from the pool`.
2. **Immediate Mitigation**:
   ```bash
   # Check active connections
   docker compose -f docker-compose.production.yml exec postgres psql -U novaqa_admin -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
   
   # Restart API cluster to reset connection pool
   docker compose -f docker-compose.production.yml restart api
   ```

### Playbook B: Worker Execution Deadlock / OOM Browser Cleanup
1. **Symptoms**: Test runs remain stuck in `QUEUED` state, CPU/Memory at 100%.
2. **Immediate Mitigation**:
   ```bash
   # Query worker health
   curl http://localhost:4001/health

   # Graceful restart of worker pool (re-spawns clean Playwright browser instances)
   docker compose -f docker-compose.production.yml restart worker
   ```

### Playbook C: Paymob Payment Webhook HMAC Failures
1. **Symptoms**: Admin dashboard reports `PAYMENT_WEBHOOK_HMAC_FAILED` spike.
2. **Immediate Mitigation**:
   - Check if Paymob secret was regenerated in the Paymob Merchant Portal.
   - Verify `PAYMOB_HMAC_SECRET` in `.env.production` matches the active portal hash key.
   - Trigger manual transaction reconciliation:
     `POST /api/v1/payments/paymob/reconcile/:paymentId` via Admin Console.
