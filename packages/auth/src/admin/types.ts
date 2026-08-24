import { PlanSlug, BillingInterval } from '../billing-types.js';

export interface SystemMetrics {
  activeUsers: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  dailyTestExecutions: number;
  failedTests: number;
  passRatePercent: number;
  totalRevenueCents: number;
  mrrCents: number;
  churnRatePercent: number;
  storageUsageGb: number;
  workerUtilizationPercent: number;
  aiTokensUsed: number;
  activeWorkers: number;
  totalProjects: number;
  activeMcpConnections: number;
  criticalSecurityFindings: number;
}

export interface AdminWorkerStatus {
  id: string;
  name: string;
  status: 'ONLINE' | 'BUSY' | 'DRAINING' | 'OFFLINE';
  concurrency: number;
  activeJobs: number;
  utilizationPercent: number;
  supportedPlatforms: string[];
  lastHeartbeat: string;
}

export interface AdminMcpConnection {
  id: string;
  clientName: string;
  clientType: 'ANTIGRAVITY' | 'CLAUDE' | 'GENERIC_MCP';
  organizationName: string;
  connectedAt: string;
  toolCallsCount: number;
  status: 'CONNECTED' | 'IDLE' | 'DISCONNECTED';
}

export interface AdminAuditLogEntry {
  id: string;
  actorUserId?: string;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId: string;
  organizationId?: string;
  organizationName?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date | string;
}

export interface FeatureFlagDTO {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isEnabled: boolean;
  rules: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
