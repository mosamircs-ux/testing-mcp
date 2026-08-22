import { z } from 'zod';

// ============================================================================
// Enums & Domain Constants
// ============================================================================

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  QA_ENGINEER = 'QA_ENGINEER',
  DEVELOPER = 'DEVELOPER',
  VIEWER = 'VIEWER',
  BILLING_MANAGER = 'BILLING_MANAGER'
}

export type Permission =
  | 'org.read'
  | 'org.update'
  | 'org.delete'
  | 'team.manage'
  | 'project.read'
  | 'project.create'
  | 'project.update'
  | 'project.delete'
  | 'test.read'
  | 'test.create'
  | 'test.execute'
  | 'test.delete'
  | 'run.read'
  | 'run.execute'
  | 'run.cancel'
  | 'finding.read'
  | 'finding.update'
  | 'billing.read'
  | 'billing.manage'
  | 'api_key.read'
  | 'api_key.create'
  | 'api_key.delete'
  | 'mcp.connect'
  | 'ai.trigger';

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
  FULLSTACK = 'FULLSTACK',
  OTHER = 'OTHER'
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

export enum DiscoveryStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// ============================================================================
// Core Domain Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  isEmailVerified: boolean;
  oauthProvider?: string | null;
  oauthId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
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
  user?: User;
  organization?: Organization;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  createdAt: Date;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  createdAt: Date;
  user?: User;
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
  appUrl?: string | null;
  authConfig?: string | null;
  repoConfig?: string | null;
  testingPreferences?: string | null;
  prdContent?: string | null;
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
  projectId?: string | null;
  userId: string;
  name: string;
  keyPrefix: string;
  hashedKey: string;
  scope: string;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
}

export interface McpSession {
  id: string;
  apiKeyId: string;
  clientName: string;
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
// Discovery Domain Types & Specification Models
// ============================================================================

export interface TechStackInfo {
  language: string;
  framework: string;
  runtime: string;
  packageManager?: string;
  database?: string;
  orm?: string;
  styling?: string;
  testingLibraries?: string[];
  keyDependencies?: string[];
}

export interface ApplicationMap {
  overview: string;
  architectureType: 'MONOLITH' | 'MICROSERVICE' | 'SPA_REST' | 'SSR_FULLSTACK' | 'MOBILE_APP';
  modules: Array<{
    name: string;
    type: string;
    description: string;
    filePaths?: string[];
    criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
}

export interface RouteItem {
  path: string;
  name: string;
  type: 'PAGE' | 'MODAL' | 'DRAWER' | 'REDIRECT';
  authRequired: boolean;
  requiredRole?: string;
  parameters?: string[];
  discoveredForms?: Array<{ name: string; fields: string[]; submitAction: string }>;
  interactiveElements?: Array<{ type: 'BUTTON' | 'INPUT' | 'LINK' | 'SELECT'; selector: string; description: string }>;
}

export interface ApiEndpointItem {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  summary: string;
  description?: string;
  authRequired: boolean;
  parameters?: Array<{ name: string; in: 'query' | 'header' | 'path' | 'body'; required: boolean; type: string }>;
  requestBodySchema?: Record<string, unknown>;
  responseStatusCodes?: number[];
}

export interface FeatureModuleItem {
  id: string;
  name: string;
  domain: string;
  priority: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';
  description: string;
  identifiedWorkflows: string[];
  recommendedScenariosCount: number;
}

export interface AuthMechanismMap {
  authType: 'NONE' | 'BEARER_JWT' | 'SESSION_COOKIE' | 'BASIC_AUTH' | 'API_KEY' | 'OAUTH2';
  loginEndpoint?: string;
  registerEndpoint?: string;
  tokenFormat?: string;
  headerName?: string;
  cookieName?: string;
  sessionExpiryDuration?: string;
}

export interface RolePermissionMap {
  roles: Array<{
    role: string;
    description: string;
    accessibleRoutes: string[];
    accessibleEndpoints: string[];
  }>;
}

export interface WorkflowJourneyItem {
  id: string;
  name: string;
  category: 'AUTHENTICATION' | 'CHECKOUT' | 'CRUD' | 'ONBOARDING' | 'SEARCH' | 'SETTINGS';
  description: string;
  estimatedSteps: number;
  steps: Array<{
    stepNumber: number;
    action: string;
    targetRouteOrEndpoint: string;
    expectedState: string;
  }>;
}

export interface RiskAreaItem {
  area: string;
  category: 'SECURITY' | 'DATA_INTEGRITY' | 'EDGE_CASE' | 'PERFORMANCE' | 'FLAKY_LOCATOR';
  severity: FindingSeverity;
  description: string;
  recommendation: string;
}

export interface NormalizedProjectSpec {
  projectName: string;
  category: string;
  version: string;
  generatedAt: string;
  summary: string;
  techStack: TechStackInfo;
  applicationMap: ApplicationMap;
  routes: RouteItem[];
  apis: ApiEndpointItem[];
  features: FeatureModuleItem[];
  authentication: AuthMechanismMap;
  roles: RolePermissionMap;
  workflows: WorkflowJourneyItem[];
  riskAreas: RiskAreaItem[];
  recommendedSuites: Array<{
    name: string;
    description: string;
    tags: string[];
    estimatedTestCases: number;
  }>;
}

export interface ProjectDiscovery {
  id: string;
  projectId: string;
  status: DiscoveryStatus;
  progress: number;
  currentStep: string;
  logs: Array<{ timestamp: string; phase: string; message: string }>;
  techStack: TechStackInfo;
  applicationMap: ApplicationMap;
  routesMap: RouteItem[];
  apiMap: ApiEndpointItem[];
  featureMap: FeatureModuleItem[];
  authMap: AuthMechanismMap;
  roleMap: RolePermissionMap;
  workflowMap: WorkflowJourneyItem[];
  riskAreas: RiskAreaItem[];
  normalizedSpec: NormalizedProjectSpec;
  startedAt: Date;
  completedAt?: Date | null;
  durationMs: number;
  errorMessage?: string | null;
}

export interface DiscoveryProgressEvent {
  discoveryId: string;
  projectId: string;
  status: DiscoveryStatus;
  progress: number;
  currentStep: string;
  logMessage: string;
  phase: string;
  timestamp: string;
  specSummary?: string;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  organizationName: z.string().min(2).max(100).optional()
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email()
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long')
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1)
});

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role).default(Role.QA_ENGINEER),
  teamId: z.string().optional()
});

export const UpdateMemberRoleSchema = z.object({
  role: z.nativeEnum(Role)
});

export const CreateApiKeySchema = z.object({
  name: z.string().min(2).max(64),
  projectId: z.string().optional(),
  scope: z.string().default('ALL'),
  expiresInDays: z.number().int().positive().optional()
});

export const ProjectOnboardingSchema = z.object({
  // STEP 1: Project Name
  name: z.string().min(2, 'Project name is required').max(100),
  description: z.string().max(500).optional(),

  // STEP 2: Project Type
  category: z.nativeEnum(ProjectCategory).default(ProjectCategory.WEB),

  // STEP 3: Environment
  environment: z.enum(['LOCAL', 'DEVELOPMENT', 'STAGING', 'PRODUCTION']).default('STAGING'),

  // STEP 4: Application URL
  appUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),

  // STEP 5: API Base URL
  apiBaseUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),

  // STEP 6: Authentication Configuration
  authConfig: z
    .object({
      type: z.enum(['NONE', 'BEARER', 'BASIC', 'COOKIE', 'CUSTOM_HEADER', 'LOGIN_FLOW']).default('NONE'),
      username: z.string().optional(),
      password: z.string().optional(),
      token: z.string().optional(),
      loginUrl: z.string().optional(),
      customHeaderName: z.string().optional(),
      customHeaderValue: z.string().optional()
    })
    .default({ type: 'NONE' }),

  // STEP 7: Optional PRD Upload / Text
  prdContent: z.string().optional(),

  // STEP 8: Optional Repository Connection
  repoConfig: z
    .object({
      repositoryUrl: z.string().optional(),
      branch: z.string().default('main'),
      localPath: z.string().optional()
    })
    .default({ branch: 'main' }),

  // STEP 9: Testing Preferences
  testingPreferences: z
    .object({
      engineType: z.nativeEnum(EngineType).default(EngineType.PLAYWRIGHT),
      viewportWidth: z.number().default(1280),
      viewportHeight: z.number().default(720),
      headless: z.boolean().default(true),
      autoHeal: z.boolean().default(true),
      captureVideo: z.boolean().default(true),
      captureScreenshots: z.boolean().default(true),
      timeoutMs: z.number().default(30000)
    })
    .default({
      engineType: EngineType.PLAYWRIGHT,
      viewportWidth: 1280,
      viewportHeight: 720,
      headless: true,
      autoHeal: true,
      captureVideo: true,
      captureScreenshots: true,
      timeoutMs: 30000
    }),

  triggerDiscovery: z.boolean().default(true)
});

export const CreateProjectSchema = z.object({
  organizationId: z.string().min(1),
  teamId: z.string().optional(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.nativeEnum(ProjectCategory),
  engineType: z.nativeEnum(EngineType).default(EngineType.PLAYWRIGHT),
  repositoryUrl: z.string().url().optional().or(z.literal('')),
  baseUrl: z.string().url().optional().or(z.literal('')),
  specUrl: z.string().url().optional().or(z.literal('')),
  appUrl: z.string().optional(),
  authConfig: z.string().optional(),
  repoConfig: z.string().optional(),
  testingPreferences: z.string().optional(),
  prdContent: z.string().optional(),
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

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

export type ProjectOnboardingInput = z.infer<typeof ProjectOnboardingSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type CreateEnvironmentInput = z.infer<typeof CreateEnvironmentSchema>;
export type CreateTestSuiteInput = z.infer<typeof CreateTestSuiteSchema>;
export type CreateTestCaseInput = z.infer<typeof CreateTestCaseSchema>;
export type TriggerTestRunInput = z.infer<typeof TriggerTestRunSchema>;
export type AIAnalyzeProjectInput = z.infer<typeof AIAnalyzeProjectSchema>;
export type AIGenerateTestsInput = z.infer<typeof AIGenerateTestsSchema>;
export type AIFailureTriageInput = z.infer<typeof AIFailureTriageSchema>;
export type AIAutoHealInput = z.infer<typeof AIAutoHealSchema>;
