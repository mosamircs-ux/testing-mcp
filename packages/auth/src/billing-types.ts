export enum PlanSlug {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  TEAM = 'TEAM',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE'
}

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';

export type BillingInterval = 'monthly' | 'yearly';

export interface PlanLimits {
  maxProjects: number; // -1 for unlimited
  maxTestExecutions: number;
  maxAiTokens: number;
  maxBrowserMinutes: number;
  maxApiRequests: number;
  maxMobileMinutes: number;
  maxStorageGb: number;
  maxArtifacts: number;
  maxTeamMembers: number;
}

export interface DimensionUsage {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  isExceeded: boolean;
  unit: string;
}

export interface UsageSnapshot {
  monthYear: string;
  plan: {
    slug: PlanSlug;
    name: string;
    status: SubscriptionStatus;
    interval: BillingInterval;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  };
  metrics: {
    projects: DimensionUsage;
    testExecutions: DimensionUsage;
    aiTokens: DimensionUsage;
    browserMinutes: DimensionUsage;
    apiRequests: DimensionUsage;
    mobileExecutionMinutes: DimensionUsage;
    storage: DimensionUsage;
    artifacts: DimensionUsage;
    teamMembers: DimensionUsage;
  };
  hasExceededAnyLimit: boolean;
}
