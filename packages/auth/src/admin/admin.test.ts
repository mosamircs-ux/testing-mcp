import { describe, it, expect, beforeAll } from 'vitest';
import { adminService, billingService, paymobService, PlanSlug } from '../index.js';
import { prisma } from '@novaqa/database';

describe('Platform Owner / Admin Dashboard Engine (@novaqa/auth/admin)', () => {
  let testAdminUserId: string;
  let testOrgId: string;

  beforeAll(async () => {
    await billingService.seedDefaultPlans();

    const adminUser = await prisma.user.create({
      data: {
        email: `platform-admin-${Date.now()}@novaqa.io`,
        name: 'Platform Owner Admin',
        passwordHash: 'admin_hash_123'
      }
    });
    testAdminUserId = adminUser.id;

    const org = await prisma.organization.create({
      data: {
        name: 'Test Admin Organization',
        slug: `admin-org-${Date.now()}`,
        status: 'ACTIVE',
        members: {
          create: {
            userId: adminUser.id,
            role: 'OWNER'
          }
        }
      }
    });
    testOrgId = org.id;

    await billingService.getOrganizationSubscription(testOrgId);
  });

  it('1. Computes full system metrics (users, orgs, tests, revenue, MRR, churn, storage, workers, AI)', async () => {
    const metrics = await adminService.getSystemMetrics();

    expect(metrics.activeUsers).toBeGreaterThan(0);
    expect(metrics.activeOrganizations).toBeGreaterThan(0);
    expect(metrics.dailyTestExecutions).toBeDefined();
    expect(metrics.failedTests).toBeDefined();
    expect(metrics.passRatePercent).toBeGreaterThanOrEqual(0);
    expect(metrics.totalRevenueCents).toBeDefined();
    expect(metrics.mrrCents).toBeDefined();
    expect(metrics.churnRatePercent).toBeDefined();
    expect(metrics.storageUsageGb).toBeDefined();
    expect(metrics.workerUtilizationPercent).toBeGreaterThan(0);
    expect(metrics.aiTokensUsed).toBeDefined();
    expect(metrics.activeWorkers).toBe(4);
    expect(metrics.activeMcpConnections).toBeGreaterThan(0);
  });

  it('2. Suspend organization -> updates status to SUSPENDED and records audit log', async () => {
    const suspended = await adminService.suspendOrganization(
      testOrgId,
      'Violation of acceptable usage policy',
      testAdminUserId
    );

    expect(suspended.status).toBe('SUSPENDED');

    // Verify DB update
    const org = await prisma.organization.findUnique({ where: { id: testOrgId } });
    expect(org?.status).toBe('SUSPENDED');

    // Verify Audit Log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'ORGANIZATION_SUSPENDED',
        resourceId: testOrgId
      }
    });

    expect(auditLog).toBeDefined();
    expect(auditLog?.userId).toBe(testAdminUserId);
    expect(auditLog?.payload).toContain('SUSPENDED');
  });

  it('3. Restore organization -> updates status to ACTIVE and records audit log', async () => {
    const restored = await adminService.restoreOrganization(testOrgId, testAdminUserId);
    expect(restored.status).toBe('ACTIVE');

    const org = await prisma.organization.findUnique({ where: { id: testOrgId } });
    expect(org?.status).toBe('ACTIVE');

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'ORGANIZATION_RESTORED',
        resourceId: testOrgId
      }
    });

    expect(auditLog).toBeDefined();
  });

  it('4. Change plan by admin -> immediately updates subscription and records audit log', async () => {
    const updatedSub = await adminService.changeOrganizationPlan(
      testOrgId,
      PlanSlug.ENTERPRISE,
      'yearly',
      testAdminUserId
    );

    expect(updatedSub.plan.slug).toBe(PlanSlug.ENTERPRISE);
    expect(updatedSub.interval).toBe('yearly');

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'PLAN_CHANGED_BY_ADMIN',
        organizationId: testOrgId
      }
    });

    expect(auditLog).toBeDefined();
    expect(auditLog?.payload).toContain('ENTERPRISE');
  });

  it('5. Grant credits -> creates credit balance and records audit log', async () => {
    const credit = await adminService.grantCredits(
      testOrgId,
      5000, // $50.00
      'SLA compensation courtesy credits',
      testAdminUserId
    );

    expect(credit.amount).toBe(5000);
    expect(credit.balanceRemaining).toBe(5000);

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'CREDITS_GRANTED',
        resourceId: credit.id
      }
    });

    expect(auditLog).toBeDefined();
  });

  it('6. Revoke credits -> zeroes remaining credit balance and records audit log', async () => {
    const credit = await adminService.grantCredits(testOrgId, 2500, 'Temporary promo');
    const revoked = await adminService.revokeCredits(credit.id, 'Promotion expired', testAdminUserId);

    expect(revoked.balanceRemaining).toBe(0);
    expect(revoked.reason).toContain('[REVOKED]');

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'CREDITS_REVOKED',
        resourceId: credit.id
      }
    });

    expect(auditLog).toBeDefined();
  });

  it('7. Refund payment by admin -> issues Paymob refund and records audit log', async () => {
    const creation = await paymobService.createPaymentIntention({
      organizationId: testOrgId,
      userId: testAdminUserId,
      planSlug: PlanSlug.PRO,
      interval: 'monthly'
    });

    const txObj = {
      id: 88776655,
      amount_cents: creation.amount,
      currency: 'USD',
      success: true,
      pending: false,
      special_reference: creation.merchantReference,
      created_at: new Date().toISOString()
    };

    const hmac = paymobService.getVerifier().generateHmac(txObj);
    await paymobService.processWebhook({ type: 'TRANSACTION', obj: txObj, hmac }, hmac);

    const refund = await adminService.refundPayment(
      creation.paymentId,
      creation.amount,
      'Administrative refund request',
      testAdminUserId
    );

    expect(refund.amount).toBe(creation.amount);
    expect(refund.status).toBe('SUCCEEDED');

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'PAYMENT_REFUNDED_BY_ADMIN',
        resourceId: creation.paymentId
      }
    });

    expect(auditLog).toBeDefined();
  });

  it('8. Feature flags management -> fetches and updates flag rules with audit logging', async () => {
    const flags = await adminService.getFeatureFlags();
    expect(flags.length).toBeGreaterThan(0);

    const updated = await adminService.setFeatureFlag(
      'AI_SELF_HEALING',
      false,
      { minTier: 'ENTERPRISE', rolloutPercentage: 50 },
      testAdminUserId
    );

    expect(updated.isEnabled).toBe(false);
    expect(updated.rules.minTier).toBe('ENTERPRISE');

    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'FEATURE_FLAG_UPDATED',
        resourceId: updated.id
      }
    });

    expect(auditLog).toBeDefined();
  });

  it('9. Telemetry retrieval -> returns worker health and MCP client connections', async () => {
    const workers = await adminService.getWorkers();
    expect(workers.length).toBe(4);
    expect(workers[0].status).toBeDefined();
    expect(workers[0].concurrency).toBeGreaterThan(0);

    const mcpConnections = await adminService.getMcpConnections();
    expect(mcpConnections.length).toBeGreaterThan(0);
    expect(mcpConnections[0].clientType).toBeDefined();
  });
});
