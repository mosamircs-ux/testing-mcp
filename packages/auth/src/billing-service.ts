import { prisma } from '@novaqa/database';
import { createChildLogger } from '@novaqa/shared';
import {
  PlanSlug,
  SubscriptionStatus,
  BillingInterval,
  PlanLimits,
  UsageSnapshot
} from './billing-types.js';

const log = createChildLogger('billing-service');

export class BillingService {
  /**
   * Seeds default dynamic plans into the database if not present.
   */
  async seedDefaultPlans(): Promise<void> {
    const existingCount = await prisma.plan.count();
    if (existingCount >= 6) return;

    const defaultPlans = [
      {
        slug: PlanSlug.FREE,
        name: 'Free Community Tier',
        description: 'For individual developers and open-source contributors.',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'USD',
        limits: JSON.stringify({
          maxProjects: 2,
          maxTestExecutions: 100,
          maxAiTokens: 50000,
          maxBrowserMinutes: 120,
          maxApiRequests: 1000,
          maxMobileMinutes: 0,
          maxStorageGb: 1,
          maxArtifacts: 200,
          maxTeamMembers: 2
        } satisfies PlanLimits),
        features: ['1 Parallel Worker Sandbox', 'Community Discord Support', 'Basic Test Catalog']
      },
      {
        slug: PlanSlug.STARTER,
        name: 'Starter Tier',
        description: 'For growing startup teams launching autonomous testing.',
        priceMonthly: 2900, // $29.00
        priceYearly: 29000, // $290.00 (2 months free)
        currency: 'USD',
        limits: JSON.stringify({
          maxProjects: 5,
          maxTestExecutions: 1000,
          maxAiTokens: 500000,
          maxBrowserMinutes: 1000,
          maxApiRequests: 10000,
          maxMobileMinutes: 60,
          maxStorageGb: 10,
          maxArtifacts: 2000,
          maxTeamMembers: 5
        } satisfies PlanLimits),
        features: ['4 Parallel Sandboxes', 'AI Failure Diagnostics', 'Standard Email Support']
      },
      {
        slug: PlanSlug.PRO,
        name: 'Professional Tier',
        description: 'For agile engineering teams with continuous CI/CD releases.',
        priceMonthly: 7900, // $79.00
        priceYearly: 79000, // $790.00
        currency: 'USD',
        limits: JSON.stringify({
          maxProjects: 15,
          maxTestExecutions: 5000,
          maxAiTokens: 2000000,
          maxBrowserMinutes: 5000,
          maxApiRequests: 50000,
          maxMobileMinutes: 300,
          maxStorageGb: 50,
          maxArtifacts: 10000,
          maxTeamMembers: 15
        } satisfies PlanLimits),
        features: ['12 Parallel Sandboxes', 'Self-Healing Selectors', 'Visual Regression', 'Slack Alerts']
      },
      {
        slug: PlanSlug.TEAM,
        name: 'Team Collaborative Tier',
        description: 'For multi-squad QA departments scaling cross-platform suites.',
        priceMonthly: 19900, // $199.00
        priceYearly: 199000, // $1,990.00
        currency: 'USD',
        limits: JSON.stringify({
          maxProjects: 30,
          maxTestExecutions: 15000,
          maxAiTokens: 5000000,
          maxBrowserMinutes: 15000,
          maxApiRequests: 150000,
          maxMobileMinutes: 1000,
          maxStorageGb: 150,
          maxArtifacts: 30000,
          maxTeamMembers: 30
        } satisfies PlanLimits),
        features: ['24 Parallel Sandboxes', 'Defensive SAST/DAST Engine', 'Android & iOS Emulators', 'Priority SLA']
      },
      {
        slug: PlanSlug.BUSINESS,
        name: 'Business Enterprise Tier',
        description: 'For enterprise organizations with compliance and high throughput.',
        priceMonthly: 49900, // $499.00
        priceYearly: 499000, // $4,990.00
        currency: 'USD',
        limits: JSON.stringify({
          maxProjects: 100,
          maxTestExecutions: 50000,
          maxAiTokens: 20000000,
          maxBrowserMinutes: 50000,
          maxApiRequests: 500000,
          maxMobileMinutes: 5000,
          maxStorageGb: 500,
          maxArtifacts: 100000,
          maxTeamMembers: 100
        } satisfies PlanLimits),
        features: ['48 Parallel Sandboxes', 'Full MCP Server Bridge', 'Dedicated Support Engineer', 'Custom Webhooks']
      },
      {
        slug: PlanSlug.ENTERPRISE,
        name: 'Enterprise Dedicated Tier',
        description: 'Custom infrastructure, unlimited scaling, and tailored SLA.',
        priceMonthly: 99900, // $999.00
        priceYearly: 999000, // $9,990.00
        currency: 'USD',
        limits: JSON.stringify({
          maxProjects: -1, // Unlimited
          maxTestExecutions: -1,
          maxAiTokens: -1,
          maxBrowserMinutes: -1,
          maxApiRequests: -1,
          maxMobileMinutes: -1,
          maxStorageGb: 5000,
          maxArtifacts: -1,
          maxTeamMembers: -1
        } satisfies PlanLimits),
        features: ['Unlimited Sandboxes', 'On-Premise Private Runners', 'SOC2 / HIPAA Compliance', 'Custom MSA']
      }
    ];

    for (const p of defaultPlans) {
      await prisma.plan.upsert({
        where: { slug: p.slug },
        update: {
          name: p.name,
          description: p.description,
          priceMonthly: p.priceMonthly,
          priceYearly: p.priceYearly,
          limits: p.limits
        },
        create: {
          slug: p.slug,
          name: p.name,
          description: p.description,
          priceMonthly: p.priceMonthly,
          priceYearly: p.priceYearly,
          currency: p.currency,
          limits: p.limits,
          features: {
            create: p.features.map((f, i) => ({
              code: `FEAT_${p.slug}_${i + 1}`,
              name: f,
              description: f
            }))
          }
        }
      });
    }

    log.info('Seeded default 6 dynamic plans into database.');
  }

  /**
   * Retrieves all active plans with database-backed pricing and limits.
   */
  async getPlans() {
    await this.seedDefaultPlans();
    return prisma.plan.findMany({
      where: { isActive: true },
      include: { features: true },
      orderBy: { priceMonthly: 'asc' }
    });
  }

  /**
   * Updates plan limits and pricing (Admin configurable).
   */
  async updatePlan(slug: PlanSlug, data: {
    name?: string;
    description?: string;
    priceMonthly?: number;
    priceYearly?: number;
    limits?: Partial<PlanLimits>;
    isActive?: boolean;
  }) {
    const existing = await prisma.plan.findUnique({ where: { slug } });
    if (!existing) throw new Error(`Plan ${slug} not found.`);

    const currentLimits: PlanLimits = JSON.parse(existing.limits || '{}');
    const updatedLimits = data.limits ? { ...currentLimits, ...data.limits } : currentLimits;

    return prisma.plan.update({
      where: { slug },
      data: {
        name: data.name ?? existing.name,
        description: data.description ?? existing.description,
        priceMonthly: data.priceMonthly ?? existing.priceMonthly,
        priceYearly: data.priceYearly ?? existing.priceYearly,
        limits: JSON.stringify(updatedLimits),
        isActive: data.isActive ?? existing.isActive
      },
      include: { features: true }
    });
  }

  /**
   * Retrieves or initializes the active subscription for an organization.
   */
  async getOrganizationSubscription(organizationId: string) {
    await this.seedDefaultPlans();

    let subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: { include: { features: true } } }
    });

    if (!subscription) {
      const freePlan = await prisma.plan.findUnique({ where: { slug: PlanSlug.FREE } });
      if (!freePlan) throw new Error('Free plan not initialized.');

      subscription = await prisma.subscription.create({
        data: {
          organizationId,
          planId: freePlan.id,
          status: 'active',
          interval: 'monthly',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        include: { plan: { include: { features: true } } }
      });
    }

    return subscription;
  }

  /**
   * Upgrades, downgrades, or modifies subscription plan.
   */
  async changeSubscription(
    organizationId: string,
    newPlanSlug: PlanSlug,
    interval: BillingInterval = 'monthly'
  ) {
    const plan = await prisma.plan.findUnique({ where: { slug: newPlanSlug } });
    if (!plan) throw new Error(`Plan ${newPlanSlug} not found.`);

    const currentSub = await this.getOrganizationSubscription(organizationId);

    const updated = await prisma.subscription.update({
      where: { id: currentSub.id },
      data: {
        planId: plan.id,
        status: 'active',
        interval,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(Date.now() + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
      },
      include: { plan: true }
    });

    // Also update organization tier
    await prisma.organization.update({
      where: { id: organizationId },
      data: { tier: newPlanSlug }
    });

    // Record invoice & transaction for paid plans
    const amount = interval === 'yearly' ? plan.priceYearly : plan.priceMonthly;
    if (amount > 0) {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await prisma.invoice.create({
        data: {
          organizationId,
          subscriptionId: updated.id,
          invoiceNumber,
          amountDue: amount,
          amountPaid: amount,
          currency: plan.currency,
          status: 'PAID',
          dueDate: new Date(),
          paidAt: new Date(),
          lineItems: JSON.stringify([
            { description: `Subscription to ${plan.name} (${interval})`, amount, quantity: 1 }
          ]),
          payments: {
            create: {
              organizationId,
              amount,
              currency: plan.currency,
              status: 'SUCCEEDED'
            }
          },
          transactions: {
            create: {
              organizationId,
              subscriptionId: updated.id,
              type: 'CHARGE',
              amount,
              currency: plan.currency,
              status: 'COMPLETED',
              description: `Payment for ${plan.name} (${interval})`
            }
          }
        }
      });
    }

    return updated;
  }

  /**
   * Cancels subscription.
   */
  async cancelSubscription(organizationId: string, cancelImmediately = false) {
    const sub = await this.getOrganizationSubscription(organizationId);

    if (cancelImmediately) {
      const freePlan = await prisma.plan.findUnique({ where: { slug: PlanSlug.FREE } });
      return prisma.subscription.update({
        where: { id: sub.id },
        data: {
          planId: freePlan!.id,
          status: 'cancelled',
          cancelAtPeriodEnd: false
        },
        include: { plan: true }
      });
    }

    return prisma.subscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
      include: { plan: true }
    });
  }

  /**
   * Tracks and increments usage across any of the 9 dimensions.
   */
  async trackUsage(
    organizationId: string,
    dimension:
      | 'projects'
      | 'testExecutions'
      | 'aiTokens'
      | 'browserMinutes'
      | 'apiRequests'
      | 'mobileExecutionMinutes'
      | 'storageBytes'
      | 'artifacts'
      | 'teamMembers',
    amount = 1
  ): Promise<void> {
    const monthYear = this.getCurrentMonthYear();

    const updateData: any = {};
    if (dimension === 'projects') updateData.projectsCount = { increment: amount };
    if (dimension === 'testExecutions') updateData.testExecutionsCount = { increment: amount };
    if (dimension === 'aiTokens') updateData.aiTokensCount = { increment: amount };
    if (dimension === 'browserMinutes') updateData.browserMinutes = { increment: amount };
    if (dimension === 'apiRequests') updateData.apiRequestsCount = { increment: amount };
    if (dimension === 'mobileExecutionMinutes') updateData.mobileExecutionMinutes = { increment: amount };
    if (dimension === 'storageBytes') updateData.storageBytes = { increment: BigInt(amount) };
    if (dimension === 'artifacts') updateData.artifactsCount = { increment: amount };
    if (dimension === 'teamMembers') updateData.teamMembersCount = { increment: amount };

    await prisma.usageMetric.upsert({
      where: { organizationId_monthYear: { organizationId, monthYear } },
      create: {
        organizationId,
        monthYear,
        ...(dimension === 'projects' ? { projectsCount: amount } : {}),
        ...(dimension === 'testExecutions' ? { testExecutionsCount: amount } : {}),
        ...(dimension === 'aiTokens' ? { aiTokensCount: amount } : {}),
        ...(dimension === 'browserMinutes' ? { browserMinutes: amount } : {}),
        ...(dimension === 'apiRequests' ? { apiRequestsCount: amount } : {}),
        ...(dimension === 'mobileExecutionMinutes' ? { mobileExecutionMinutes: amount } : {}),
        ...(dimension === 'storageBytes' ? { storageBytes: BigInt(amount) } : {}),
        ...(dimension === 'artifacts' ? { artifactsCount: amount } : {}),
        ...(dimension === 'teamMembers' ? { teamMembersCount: amount } : {})
      },
      update: updateData
    });
  }

  /**
   * Generates a complete usage and quota snapshot across all 9 tracked dimensions.
   */
  async getUsageSnapshot(organizationId: string): Promise<UsageSnapshot> {
    const sub = await this.getOrganizationSubscription(organizationId);
    const limits: PlanLimits = JSON.parse(sub.plan.limits || '{}');
    const monthYear = this.getCurrentMonthYear();

    let usage = await prisma.usageMetric.findUnique({
      where: { organizationId_monthYear: { organizationId, monthYear } }
    });

    if (!usage) {
      usage = await prisma.usageMetric.create({
        data: { organizationId, monthYear }
      });
    }

    const storageGbUsed = Number(usage.storageBytes) / (1024 * 1024 * 1024);

    const calcDimension = (used: number, limit: number, unit: string) => {
      const isUnlimited = limit === -1;
      const effectiveLimit = isUnlimited ? Infinity : limit;
      const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);
      const percentage = isUnlimited ? 0 : limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
      const isExceeded = !isUnlimited && used > limit;

      return {
        used,
        limit: isUnlimited ? -1 : limit,
        remaining: isUnlimited ? -1 : remaining,
        percentage,
        isExceeded,
        unit
      };
    };

    const metrics = {
      projects: calcDimension(usage.projectsCount, limits.maxProjects, 'Projects'),
      testExecutions: calcDimension(usage.testExecutionsCount, limits.maxTestExecutions, 'Runs'),
      aiTokens: calcDimension(usage.aiTokensCount, limits.maxAiTokens, 'Tokens'),
      browserMinutes: calcDimension(usage.browserMinutes, limits.maxBrowserMinutes, 'Minutes'),
      apiRequests: calcDimension(usage.apiRequestsCount, limits.maxApiRequests, 'Requests'),
      mobileExecutionMinutes: calcDimension(usage.mobileExecutionMinutes, limits.maxMobileMinutes, 'Minutes'),
      storage: calcDimension(Number(storageGbUsed.toFixed(1)), limits.maxStorageGb, 'GB'),
      artifacts: calcDimension(usage.artifactsCount, limits.maxArtifacts, 'Files'),
      teamMembers: calcDimension(usage.teamMembersCount, limits.maxTeamMembers, 'Members')
    };

    const hasExceededAnyLimit = Object.values(metrics).some((m) => m.isExceeded);

    return {
      monthYear,
      plan: {
        slug: sub.plan.slug as PlanSlug,
        name: sub.plan.name,
        status: sub.status as SubscriptionStatus,
        interval: sub.interval as BillingInterval,
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd
      },
      metrics,
      hasExceededAnyLimit
    };
  }

  /**
   * Retrieves Invoices and Payment History for organization.
   */
  async getInvoices(organizationId: string) {
    return prisma.invoice.findMany({
      where: { organizationId },
      include: { payments: true, transactions: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Grants account credits.
   */
  async grantCredit(organizationId: string, amount: number, reason: string) {
    return prisma.credit.create({
      data: {
        organizationId,
        amount,
        balanceRemaining: amount,
        reason,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    });
  }

  /**
   * Issues refund for a payment.
   */
  async issueRefund(organizationId: string, paymentId: string, amount: number, reason: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    return prisma.refund.create({
      data: {
        organizationId,
        paymentId: payment ? payment.id : undefined,
        amount,
        reason,
        status: 'SUCCEEDED'
      }
    });
  }

  private getCurrentMonthYear(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}

export const billingService = new BillingService();
