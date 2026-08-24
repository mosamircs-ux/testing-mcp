import { describe, it, expect, beforeAll } from 'vitest';
import { billingService, PlanSlug } from './index.js';
import { prisma } from '@novaqa/database';

describe('SaaS Billing & Quota Engine (@novaqa/auth)', () => {
  let testOrgId: string;

  beforeAll(async () => {
    const org = await prisma.organization.create({
      data: {
        name: 'Billing Test Enterprise',
        slug: `bill-org-${Date.now()}`
      }
    });
    testOrgId = org.id;

    // Seed default dynamic plans
    await billingService.seedDefaultPlans();
  });

  describe('1. Dynamic Plans & Admin Limits Configuration', () => {
    it('should retrieve all 6 dynamic plans from database', async () => {
      const plans = await billingService.getPlans();
      expect(plans.length).toBeGreaterThanOrEqual(6);

      const slugs = plans.map((p) => p.slug);
      expect(slugs).toContain(PlanSlug.FREE);
      expect(slugs).toContain(PlanSlug.STARTER);
      expect(slugs).toContain(PlanSlug.PRO);
      expect(slugs).toContain(PlanSlug.TEAM);
      expect(slugs).toContain(PlanSlug.BUSINESS);
      expect(slugs).toContain(PlanSlug.ENTERPRISE);

      // Verify prices are dynamic database fields
      const proPlan = plans.find((p) => p.slug === PlanSlug.PRO)!;
      expect(proPlan.priceMonthly).toBe(7900);
      expect(proPlan.priceYearly).toBe(79000);
    });

    it('should allow admin to configure plan prices and limits dynamically in the DB', async () => {
      const updated = await billingService.updatePlan(PlanSlug.STARTER, {
        priceMonthly: 3500, // Update price to $35.00
        limits: { maxTestExecutions: 1500 }
      });

      expect(updated.priceMonthly).toBe(3500);
      const limits = JSON.parse(updated.limits);
      expect(limits.maxTestExecutions).toBe(1500);
    });
  });

  describe('2. Subscription Lifecycle (trial, active, past_due, cancelled, expired)', () => {
    it('should initialize organization with default active Free subscription', async () => {
      const sub = await billingService.getOrganizationSubscription(testOrgId);
      expect(sub.plan.slug).toBe(PlanSlug.FREE);
      expect(sub.status).toBe('active');
    });

    it('should upgrade subscription to PRO tier and generate invoice & transaction', async () => {
      const upgraded = await billingService.changeSubscription(testOrgId, PlanSlug.PRO, 'yearly');
      expect(upgraded.plan.slug).toBe(PlanSlug.PRO);
      expect(upgraded.interval).toBe('yearly');

      const invoices = await billingService.getInvoices(testOrgId);
      expect(invoices.length).toBeGreaterThan(0);
      expect(invoices[0].amountPaid).toBe(79000);
      expect(invoices[0].status).toBe('PAID');
    });

    it('should handle cancel subscription lifecycle', async () => {
      const cancelled = await billingService.cancelSubscription(testOrgId, false);
      expect(cancelled.cancelAtPeriodEnd).toBe(true);

      const immediateCancel = await billingService.cancelSubscription(testOrgId, true);
      expect(immediateCancel.status).toBe('cancelled');
    });
  });

  describe('3. 9-Dimension Usage Tracking & Quota Limits', () => {
    it('should track usage across all 9 resource dimensions', async () => {
      await billingService.changeSubscription(testOrgId, PlanSlug.PRO, 'monthly');

      await billingService.trackUsage(testOrgId, 'projects', 2);
      await billingService.trackUsage(testOrgId, 'testExecutions', 140);
      await billingService.trackUsage(testOrgId, 'aiTokens', 25000);
      await billingService.trackUsage(testOrgId, 'browserMinutes', 45);
      await billingService.trackUsage(testOrgId, 'apiRequests', 850);
      await billingService.trackUsage(testOrgId, 'mobileExecutionMinutes', 12);
      await billingService.trackUsage(testOrgId, 'storageBytes', 1024 * 1024 * 500); // 500 MB
      await billingService.trackUsage(testOrgId, 'artifacts', 80);
      await billingService.trackUsage(testOrgId, 'teamMembers', 3);

      const snapshot = await billingService.getUsageSnapshot(testOrgId);

      expect(snapshot.plan.slug).toBe(PlanSlug.PRO);
      expect(snapshot.metrics.projects.used).toBe(2);
      expect(snapshot.metrics.testExecutions.used).toBe(140);
      expect(snapshot.metrics.aiTokens.used).toBe(25000);
      expect(snapshot.metrics.browserMinutes.used).toBe(45);
      expect(snapshot.metrics.apiRequests.used).toBe(850);
      expect(snapshot.metrics.mobileExecutionMinutes.used).toBe(12);
      expect(snapshot.metrics.artifacts.used).toBe(80);
      expect(snapshot.metrics.teamMembers.used).toBe(3);
      expect(snapshot.hasExceededAnyLimit).toBe(false);
    });

    it('should detect when usage quota limit is exceeded', async () => {
      // Free plan has max 2 projects
      await billingService.changeSubscription(testOrgId, PlanSlug.FREE);
      await billingService.trackUsage(testOrgId, 'projects', 2); // Now 4 total

      const snapshot = await billingService.getUsageSnapshot(testOrgId);
      expect(snapshot.metrics.projects.isExceeded).toBe(true);
      expect(snapshot.hasExceededAnyLimit).toBe(true);
    });
  });

  describe('4. Credits & Refunds Processing', () => {
    it('should grant account credits and track remaining balance', async () => {
      const credit = await billingService.grantCredit(testOrgId, 5000, 'Customer satisfaction promotional credit');
      expect(credit.amount).toBe(5000);
      expect(credit.balanceRemaining).toBe(5000);
    });

    it('should process and record refunds', async () => {
      const refund = await billingService.issueRefund(testOrgId, 'pmt_sample_123', 2900, 'Downgrade proration refund');
      expect(refund.amount).toBe(2900);
      expect(refund.status).toBe('SUCCEEDED');
    });
  });
});
