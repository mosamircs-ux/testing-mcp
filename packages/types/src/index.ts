import { z } from 'zod';

// ============================================================================
// Enums & Domain Constants
// ============================================================================

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  ENGINEER = 'ENGINEER',
  VIEWER = 'VIEWER'
}

export enum ProjectCategory {
  WEB = 'WEB',
  REST_API = 'REST_API',
  GRAPHQL_API = 'GRAPHQL_API',
  BACKEND_SERVICE = 'BACKEND_SERVICE',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  SAAS = 'SAAS',
  ECOMMERCE = 'ECOMMERCE',
  ERP = 'ERP',
  CRM = 'CRM',
  FINTECH = 'FINTECH',
  HEALTHCARE = 'HEALTHCARE',
  MOBILE_ANDROID = 'MOBILE_ANDROID',
  MOBILE_IOS = 'MOBILE_IOS',
  MOBILE_REACT_NATIVE = 'MOBILE_REACT_NATIVE',
  MOBILE_FLUTTER = 'MOBILE_FLUTTER',
  MICROSERVICE = 'MICROSERVICE',
  FULLSTACK = 'FULLSTACK'
}

export enum EngineType {
  PLAYWRIGHT = 'PLAYWRIGHT',
  API_REST = 'API_REST',
  API_GRAPHQL = 'API_GRAPHQL',
  MOBILE_HARNESS = 'MOBILE_HARNESS'
}

export enum TestRunStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  TIMED_OUT = 'TIMED_OUT'
}

export enum TestResultStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  FLAKY = 'FLAKY',
  TIMED_OUT = 'TIMED_OUT'
}

export enum FindingSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO'
}

export enum FindingCategory {
  BUG = 'BUG',
  FLAKY_TEST = 'FLAKY_TEST',
  REGRESSION = 'REGRESSION',
  SPEC_DRIFT = 'SPEC_DRIFT',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY'
}

export enum FindingStatus {
  OPEN = 'OPEN',
  TRIAGED = 'TRIAGED',
  AUTO_HEALED = 'AUTO_HEALED',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED'
}

export enum ArtifactType {
  SCREENSHOT = 'SCREENSHOT',
  VIDEO = 'VIDEO',
  DOM_SNAPSHOT = 'DOM_SNAPSHOT',
  NETWORK_HAR = 'NETWORK_HAR',
  CONSOLE_LOG = 'CONSOLE_LOG',
  EXECUTION_TRACE = 'EXECUTION_TRACE',
  API_RESPONSE = 'API_RESPONSE'
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

// ============================================================================
// Core Domain Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  createdAt: Date;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  organizationId: string;
  teamId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  category: ProjectCategory;
  engineType: EngineType;
  repositoryUrl?: string | null;
  baseUrl?: string | null;
  specUrl?: string | null;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  baseUrl: string;
  variables: Record<string, string>;
  headers: Record<string, string>;
  isDefault: boolean;
  createdAt: Date;
}

export interface TestSuite {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  tags: string[];
  cronSchedule?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestCase {
  id: string;
  suiteId: string;
  title: string;
  description?: string | null;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  steps: TestCaseStep[];
  expectedResult: string;
  codeSnippet?: string | null;
  isFlaky: boolean;
  flakinessScore: number;
  autoHealEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestCaseStep {
  id: string;
  order: number;
  action: 'NAVIGATE' | 'CLICK' | 'TYPE' | 'ASSERT' | 'HOVER' | 'SCROLL' | 'REQUEST' | 'WAIT';
  target?: string;
  value?: string;
  description: string;
  expectedOutput?: string;
}

export interface TestRun {
  id: string;
  projectId: string;
  suiteId?: string | null;
  environmentId: string;
  triggeredById?: string | null;
  triggerSource: 'MANUAL' | 'SCHEDULE' | 'CI_CD' | 'MCP_AGENT' | 'AUTO_HEAL';
  status: TestRunStatus;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  durationMs: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
}

export interface TestResult {
  id: string;
  testRunId: string;
  testCaseId: string;
  status: TestResultStatus;
  durationMs: number;
  errorMessage?: string | null;
  stackTrace?: string | null;
  stepResults: TestStepResult[];
  startedAt: Date;
  completedAt: Date;
}

export interface TestStepResult {
  stepId: string;
  order: number;
  action: string;
  target?: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  durationMs: number;
  error?: string;
  screenshotArtifactId?: string;
  domArtifactId?: string;
}

export interface Finding {
  id: string;
  testRunId: string;
  testResultId: string;
  projectId: string;
  category: FindingCategory;
  severity: FindingSeverity;
  status: FindingStatus;
  title: string;
  description: string;
  rootCauseAnalysis: string;
  suggestedFix?: string | null;
  suggestedPatch?: string | null;
  autoHealSelector?: string | null;
  rawLogExcerpt?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Artifact {
  id: string;
  testRunId: string;
  testResultId?: string | null;
  type: ArtifactType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  storageUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  keyPrefix: string;
  hashedKey: string;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
}

export interface McpSession {
  id: string;
  apiKeyId: string;
  clientName: string; // 'Cursor' | 'Antigravity' | 'Claude' | 'Codex'
  clientVersion?: string | null;
  lastActiveAt: Date;
  ipAddress?: string | null;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  payload: Record<string, unknown>;
  ipAddress?: string | null;
  createdAt: Date;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const CreateProjectSchema = z.object({
  organizationId: z.string().min(1),
  teamId: z.string().optional(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.nativeEnum(ProjectCategory),
  engineType: z.nativeEnum(EngineType).default(EngineType.PLAYWRIGHT),
  repositoryUrl: z.string().url().optional(),
  baseUrl: z.string().url().optional(),
  specUrl: z.string().url().optional(),
  settings: z.record(z.unknown()).default({})
});

export const CreateEnvironmentSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(50),
  baseUrl: z.string().url(),
  variables: z.record(z.string()).default({}),
  headers: z.record(z.string()).default({}),
  isDefault: z.boolean().default(false)
});

export const CreateTestSuiteSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
  cronSchedule: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const CreateTestCaseSchema = z.object({
  suiteId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  category: z.string().default('functional'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  steps: z.array(
    z.object({
      id: z.string().optional(),
      order: z.number(),
      action: z.enum(['NAVIGATE', 'CLICK', 'TYPE', 'ASSERT', 'HOVER', 'SCROLL', 'REQUEST', 'WAIT']),
      target: z.string().optional(),
      value: z.string().optional(),
      description: z.string(),
      expectedOutput: z.string().optional()
    })
  ),
  expectedResult: z.string(),
  codeSnippet: z.string().optional(),
  autoHealEnabled: z.boolean().default(true)
});

export const TriggerTestRunSchema = z.object({
  projectId: z.string().min(1),
  suiteId: z.string().optional(),
  environmentId: z.string().min(1),
  triggerSource: z.enum(['MANUAL', 'SCHEDULE', 'CI_CD', 'MCP_AGENT', 'AUTO_HEAL']).default('MANUAL'),
  testCaseIds: z.array(z.string()).optional(),
  overrideBaseUrl: z.string().url().optional()
});

export const AIAnalyzeProjectSchema = z.object({
  projectId: z.string().min(1),
  repositoryContext: z.string().optional(),
  specContent: z.string().optional(),
  targetUrl: z.string().url().optional(),
  projectCategory: z.nativeEnum(ProjectCategory).optional()
});

export const AIGenerateTestsSchema = z.object({
  projectId: z.string().min(1),
  suiteId: z.string().optional(),
  featureDescription: z.string().min(5),
  targetUrl: z.string().url().optional(),
  categories: z.array(z.string()).default(['functional', 'edge-case', 'security'])
});

export const AIFailureTriageSchema = z.object({
  testResultId: z.string().min(1),
  errorMessage: z.string(),
  stackTrace: z.string().optional(),
  stepLogs: z.array(z.string()).optional(),
  domSnapshot: z.string().optional(),
  networkCalls: z.array(z.record(z.unknown())).optional()
});

export const AIAutoHealSchema = z.object({
  testCaseId: z.string().min(1),
  failedStepOrder: z.number(),
  failedSelector: z.string(),
  currentDomSnapshot: z.string(),
  errorMessage: z.string()
});

// ============================================================================
// MCP Tool Definitions & DTOs
// ============================================================================

export interface McpToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type CreateEnvironmentInput = z.infer<typeof CreateEnvironmentSchema>;
export type CreateTestSuiteInput = z.infer<typeof CreateTestSuiteSchema>;
export type CreateTestCaseInput = z.infer<typeof CreateTestCaseSchema>;
export type TriggerTestRunInput = z.infer<typeof TriggerTestRunSchema>;
export type AIAnalyzeProjectInput = z.infer<typeof AIAnalyzeProjectSchema>;
export type AIGenerateTestsInput = z.infer<typeof AIGenerateTestsSchema>;
export type AIFailureTriageInput = z.infer<typeof AIFailureTriageSchema>;
export type AIAutoHealInput = z.infer<typeof AIAutoHealSchema>;
