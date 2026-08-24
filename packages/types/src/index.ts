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
  MOBILE_HARNESS = 'MOBILE_HARNESS',
  MOBILE_ANDROID = 'MOBILE_ANDROID',
  MOBILE_IOS = 'MOBILE_IOS'
}

export enum MobilePlatform {
  ANDROID = 'ANDROID',
  IOS = 'IOS'
}

export enum MobileFramework {
  REACT_NATIVE = 'REACT_NATIVE',
  FLUTTER = 'FLUTTER',
  NATIVE_ANDROID = 'NATIVE_ANDROID',
  NATIVE_IOS = 'NATIVE_IOS',
  CORDOVA_IONIC = 'CORDOVA_IONIC',
  GENERIC_MOBILE = 'GENERIC_MOBILE'
}

export enum MobileDeviceType {
  EMULATOR = 'EMULATOR',
  SIMULATOR = 'SIMULATOR',
  REAL_DEVICE = 'REAL_DEVICE',
  CLOUD_FARM = 'CLOUD_FARM'
}

export enum MobileDeviceState {
  BOOTING = 'BOOTING',
  READY = 'READY',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR'
}

export enum MobileNetworkState {
  WIFI = 'WIFI',
  DATA_5G = 'DATA_5G',
  DATA_4G = 'DATA_4G',
  DATA_3G = 'DATA_3G',
  OFFLINE = 'OFFLINE',
  AIRPLANE_MODE = 'AIRPLANE_MODE'
}

export enum MobileActionType {
  LAUNCH_APP = 'LAUNCH_APP',
  RESET_APP = 'RESET_APP',
  TERMINATE_APP = 'TERMINATE_APP',
  INSTALL_APP = 'INSTALL_APP',
  UNINSTALL_APP = 'UNINSTALL_APP',
  TAP = 'TAP',
  DOUBLE_TAP = 'DOUBLE_TAP',
  LONG_PRESS = 'LONG_PRESS',
  SWIPE = 'SWIPE',
  SCROLL = 'SCROLL',
  DRAG_AND_DROP = 'DRAG_AND_DROP',
  TYPE = 'TYPE',
  CLEAR_TEXT = 'CLEAR_TEXT',
  HIDE_KEYBOARD = 'HIDE_KEYBOARD',
  PRESS_BACK = 'PRESS_BACK',
  PRESS_HOME = 'PRESS_HOME',
  OPEN_NOTIFICATIONS = 'OPEN_NOTIFICATIONS',
  OPEN_APP_SWITCHER = 'OPEN_APP_SWITCHER',
  GRANT_PERMISSION = 'GRANT_PERMISSION',
  REVOKE_PERMISSION = 'REVOKE_PERMISSION',
  OPEN_DEEP_LINK = 'OPEN_DEEP_LINK',
  SEND_PUSH_NOTIFICATION = 'SEND_PUSH_NOTIFICATION',
  SET_NETWORK_STATE = 'SET_NETWORK_STATE',
  CAPTURE_SCREENSHOT = 'CAPTURE_SCREENSHOT',
  START_RECORDING = 'START_RECORDING',
  STOP_RECORDING = 'STOP_RECORDING',
  GET_DEVICE_LOGS = 'GET_DEVICE_LOGS',
  DETECT_CRASHES = 'DETECT_CRASHES',
  ASSERT_ELEMENT_VISIBLE = 'ASSERT_ELEMENT_VISIBLE',
  ASSERT_TEXT_PRESENT = 'ASSERT_TEXT_PRESENT',
  ASSERT_APP_IN_FOREGROUND = 'ASSERT_APP_IN_FOREGROUND'
}

export interface MobileDeviceInfo {
  id: string;
  name: string;
  platform: MobilePlatform;
  framework?: MobileFramework;
  deviceType: MobileDeviceType;
  osVersion: string;
  screenResolution: { width: number; height: number };
  pixelRatio?: number;
  state: MobileDeviceState;
  currentApp?: string;
  batteryLevel?: number;
  networkState?: MobileNetworkState;
  isLocked?: boolean;
}

export interface MobileLocator {
  accessibilityId?: string;
  id?: string;
  text?: string;
  xpath?: string;
  coordinates?: { x: number; y: number };
  role?: string;
}

export interface MobileCrashReport {
  crashId: string;
  timestamp: string;
  processName: string;
  crashType: 'FATAL_EXCEPTION' | 'NATIVE_CRASH' | 'ANR' | 'MEMORY_OOM' | 'EXCEPTION';
  stackTrace: string;
  logSnippet: string[];
  reproducedStepOrder?: number;
}

export interface MobileScenarioTemplate {
  scenarioId: string;
  title: string;
  category: string;
  framework: MobileFramework;
  platform: MobilePlatform;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  steps: Array<{
    order: number;
    action: MobileActionType | string;
    target?: string;
    value?: string;
    description: string;
    expectedOutput?: string;
  }>;
  expectedResult: string;
}

export enum TestRunStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
  FLAKY = 'FLAKY',
  TIMED_OUT = 'TIMED_OUT'
}

export enum TestResultStatus {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
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
  REAL_BUG = 'REAL_BUG',
  TEST_FLAKINESS = 'TEST_FLAKINESS',
  SELECTOR_DRIFT = 'SELECTOR_DRIFT',
  TIMING_ISSUE = 'TIMING_ISSUE',
  NETWORK_ISSUE = 'NETWORK_ISSUE',
  ENVIRONMENT_ISSUE = 'ENVIRONMENT_ISSUE',
  DATA_ISSUE = 'DATA_ISSUE',
  AUTHENTICATION_ISSUE = 'AUTHENTICATION_ISSUE',
  PERMISSION_ISSUE = 'PERMISSION_ISSUE',
  UNKNOWN = 'UNKNOWN',
  // Backward-compatibility aliases
  BUG = 'REAL_BUG',
  FLAKY_TEST = 'TEST_FLAKINESS',
  REGRESSION = 'REAL_BUG',
  SPEC_DRIFT = 'SELECTOR_DRIFT',
  PERFORMANCE = 'TIMING_ISSUE',
  SECURITY = 'PERMISSION_ISSUE'
}

export enum FindingStatus {
  OPEN = 'OPEN',
  TRIAGED = 'TRIAGED',
  AUTO_HEALED = 'AUTO_HEALED',
  FIX_PROPOSED = 'FIX_PROPOSED',
  FIX_APPROVED = 'FIX_APPROVED',
  VERIFICATION_RUNNING = 'VERIFICATION_RUNNING',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  RESOLVED = 'RESOLVED',
  IGNORED = 'IGNORED'
}

export enum ArtifactType {
  SCREENSHOT = 'SCREENSHOT',
  VIDEO = 'VIDEO',
  DOM_SNAPSHOT = 'DOM_SNAPSHOT',
  ACCESSIBILITY_SNAPSHOT = 'ACCESSIBILITY_SNAPSHOT',
  NETWORK_HAR = 'NETWORK_HAR',
  CONSOLE_LOG = 'CONSOLE_LOG',
  EXECUTION_TRACE = 'EXECUTION_TRACE',
  API_RESPONSE = 'API_RESPONSE',
  TIMING_METRICS = 'TIMING_METRICS'
}

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export interface ViewportConfig {
  width: number;
  height: number;
  isMobile?: boolean;
  hasTouch?: boolean;
  deviceScaleFactor?: number;
}

export interface NetworkTimingMetrics {
  dnsLookupMs?: number;
  tcpHandshakeMs?: number;
  tlsNegotiationMs?: number;
  timeToFirstByteMs: number;
  totalDurationMs: number;
  requestBodySize?: number;
  responseBodySize?: number;
}

export interface NetworkInterceptionEntry {
  id: string;
  url: string;
  method: string;
  resourceType: string;
  status: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  durationMs: number;
  requestBody?: string;
  responseBody?: string;
  failed?: boolean;
  failureText?: string;
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
// 19 Specialized Test Categories & Planning Types
// ============================================================================

export enum TestCategory {
  FUNCTIONAL = 'Functional',
  UI = 'UI',
  E2E = 'E2E',
  API = 'API',
  INTEGRATION = 'Integration',
  REGRESSION = 'Regression',
  SMOKE = 'Smoke',
  SANITY = 'Sanity',
  ACCESSIBILITY = 'Accessibility',
  RESPONSIVE = 'Responsive',
  AUTHENTICATION = 'Authentication',
  AUTHORIZATION = 'Authorization',
  NEGATIVE = 'Negative',
  EDGE_CASES = 'Edge Cases',
  VALIDATION = 'Validation',
  BUSINESS_LOGIC = 'Business Logic',
  DATA_INTEGRITY = 'Data Integrity',
  PERFORMANCE_BOUNDARIES = 'Performance boundaries',
  SECURITY_CHECKS = 'Security-oriented functional checks'
}

export enum ScenarioType {
  HAPPY_PATH = 'HAPPY_PATH',
  NEGATIVE_PATH = 'NEGATIVE_PATH',
  EDGE_CASE = 'EDGE_CASE'
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum AutomationStatus {
  DRAFT = 'DRAFT',
  READY_FOR_AUTOMATION = 'READY_FOR_AUTOMATION',
  AUTOMATED = 'AUTOMATED',
  MANUAL_ONLY = 'MANUAL_ONLY'
}

export enum TestPlanStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  ARCHIVED = 'ARCHIVED'
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
  id?: string;
  testCaseId?: string;
  order: number;
  action:
    | 'NAVIGATE'
    | 'GOTO'
    | 'CLICK'
    | 'DBLCLICK'
    | 'TYPE'
    | 'FILL'
    | 'CHECK'
    | 'UNCHECK'
    | 'SELECT'
    | 'SELECT_OPTION'
    | 'ASSERT'
    | 'ASSERTION'
    | 'HOVER'
    | 'SCROLL'
    | 'PRESS'
    | 'KEYPRESS'
    | 'DRAG'
    | 'DRAG_AND_DROP'
    | 'REQUEST'
    | 'GRAPHQL'
    | 'HTTP'
    | 'EXTRACT'
    | 'WAIT'
    | 'WAIT_FOR'
    | 'SCREENSHOT'
    | string;
  target?: string;
  value?: string;
  description?: string;
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

export interface FailureEvidence {
  failedStep?: {
    order: number;
    action: string;
    target?: string;
    value?: string;
    expectedOutput?: string;
    error?: string;
  };
  screenshotUrls?: string[];
  domSnapshotSnippet?: string;
  consoleErrors?: Array<{ level: string; message: string; timestamp?: string }>;
  networkFailures?: Array<{ url: string; method: string; status: number; durationMs?: number; error?: string }>;
  apiResponses?: Array<{ url: string; method: string; status: number; bodySnippet?: string; durationMs?: number }>;
  stackTrace?: string;
  applicationLogs?: string[];
  historicalFlakinessScore?: number;
  recentRunHistory?: Array<{ runId: string; status: string; durationMs: number; timestamp: string }>;
  codebaseSnippet?: string;
}

export type SelfHealType =
  | 'SELECTOR_UPDATE'
  | 'WAIT_STRATEGY'
  | 'LOCATOR_IMPROVEMENT'
  | 'RETRY_TUNING'
  | 'NON_SEMANTIC_MAINTENANCE';

export interface SelfHealAction {
  type: SelfHealType;
  targetCaseId: string;
  stepOrder?: number;
  originalValue: string;
  healedValue: string;
  confidence: number;
  explanation: string;
  patchDiff?: string;
  safeToAutoApply: boolean;
}

export interface FixHistoryEntry {
  id?: string;
  timestamp: string;
  action: 'PROPOSED' | 'APPROVED' | 'AUTO_APPLIED' | 'APPLIED' | 'VERIFICATION_STARTED' | 'VERIFIED' | 'VERIFICATION_FAILED' | 'ROLLED_BACK';
  actor: string; // User email, User ID, or 'AI_SELF_HEALER'
  details: string;
  patchDiff?: string;
  verificationRunId?: string;
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
  confidence?: number | null;
  evidence?: FailureEvidence | string | null;
  affectedFiles?: string[] | string | null;
  affectedCode?: string[] | string | null;
  regressionRisk?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  fixApproved?: boolean;
  fixAppliedAt?: Date | null;
  verificationRunId?: string | null;
  fixHistory?: FixHistoryEntry[] | string | null;
  rawLogExcerpt?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SelfHealLog {
  id: string;
  findingId: string;
  testCaseId: string;
  healType: SelfHealType | string;
  originalValue: string;
  healedValue: string;
  confidence: number;
  appliedAt: Date;
  verificationStatus: 'PENDING' | 'PASSED' | 'FAILED' | 'ROLLED_BACK';
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
// AI Test Planning Domain Models & Coverage Metrics
// ============================================================================

export interface CoverageMetrics {
  requirementCoverage: number; // 0 - 100%
  routeCoverage: number;       // 0 - 100%
  apiCoverage: number;         // 0 - 100%
  featureCoverage: number;     // 0 - 100%
  roleCoverage: number;        // 0 - 100%
  negativePathCoverage: number;// 0 - 100%
  totalScenarios: number;
  happyPathCount: number;
  negativePathCount: number;
  edgeCaseCount: number;
}

export interface PlannedTestCase {
  id: string;
  customId: string; // e.g. "TC001", "TC002"
  testPlanId: string;
  projectId: string;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: TestCategory | string;
  scenarioType: ScenarioType;
  preconditions: string[];
  testData: Record<string, unknown>;
  steps: Array<{
    order: number;
    action: string;
    target: string;
    value?: string;
    description: string;
    expectedOutput?: string;
  }>;
  expectedResults: string;
  risk: string;
  requirementReference: string; // Traceability back to PRD / Discovered Feature
  affectedRoutes: string[];
  affectedApis: string[];
  roles: string[];
  environment: string;
  automationStatus: AutomationStatus;
  reviewStatus: ReviewStatus;
  tags: string[];
  groupName: string;
  semanticHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestPlan {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  version: string;
  status: TestPlanStatus;
  summary: string;
  coverageMetrics: CoverageMetrics;
  userInstructions?: string | null;
  testCases?: PlannedTestCase[];
  createdAt: Date;
  updatedAt: Date;
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
  name: z.string().min(2, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.nativeEnum(ProjectCategory).default(ProjectCategory.WEB),
  environment: z.enum(['LOCAL', 'DEVELOPMENT', 'STAGING', 'PRODUCTION']).default('STAGING'),
  appUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  apiBaseUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
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
  prdContent: z.string().optional(),
  repoConfig: z
    .object({
      repositoryUrl: z.string().optional(),
      branch: z.string().default('main'),
      localPath: z.string().optional()
    })
    .default({ branch: 'main' }),
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

export const GenerateTestPlanSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(2).max(100).optional(),
  userInstructions: z.string().max(2000).optional(),
  categories: z.array(z.string()).optional(),
  focusAreas: z.array(z.string()).optional(),
  includeNegativeScenarios: z.boolean().default(true),
  includeEdgeCases: z.boolean().default(true)
});

export const BulkTestCaseActionSchema = z.object({
  testCaseIds: z.array(z.string()).min(1),
  action: z.enum(['APPROVE', 'REJECT', 'PRIORITIZE', 'TAG', 'GROUP', 'DUPLICATE', 'MERGE', 'DELETE']),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  tags: z.array(z.string()).optional(),
  groupName: z.string().optional()
});

export const UpdatePlannedTestCaseSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  category: z.string().optional(),
  scenarioType: z.enum(['HAPPY_PATH', 'NEGATIVE_PATH', 'EDGE_CASE']).optional(),
  preconditions: z.array(z.string()).optional(),
  testData: z.record(z.unknown()).optional(),
  steps: z.array(
    z.object({
      order: z.number(),
      action: z.string(),
      target: z.string(),
      value: z.string().optional(),
      description: z.string(),
      expectedOutput: z.string().optional()
    })
  ).optional(),
  expectedResults: z.string().optional(),
  risk: z.string().optional(),
  requirementReference: z.string().optional(),
  affectedRoutes: z.array(z.string()).optional(),
  affectedApis: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  environment: z.string().optional(),
  automationStatus: z.enum(['DRAFT', 'READY_FOR_AUTOMATION', 'AUTOMATED', 'MANUAL_ONLY']).optional(),
  reviewStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  tags: z.array(z.string()).optional(),
  groupName: z.string().optional()
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
  testCaseId: z.string().optional(),
  testRunId: z.string().optional(),
  projectId: z.string().optional(),
  errorMessage: z.string(),
  stackTrace: z.string().optional(),
  stepLogs: z.array(z.string()).optional(),
  domSnapshot: z.string().optional(),
  consoleOutput: z.array(
    z.object({
      level: z.string(),
      message: z.string(),
      timestamp: z.string().optional()
    })
  ).optional(),
  networkCalls: z.array(z.record(z.unknown())).optional(),
  apiResponses: z.array(
    z.object({
      url: z.string(),
      method: z.string(),
      status: z.number(),
      body: z.string().optional(),
      durationMs: z.number().optional()
    })
  ).optional(),
  screenshotUrls: z.array(z.string()).optional(),
  previousRunResults: z.array(
    z.object({
      runId: z.string(),
      status: z.string(),
      durationMs: z.number(),
      timestamp: z.string()
    })
  ).optional(),
  applicationLogs: z.array(z.string()).optional(),
  codebaseContext: z.string().optional(),
  failedStepDetails: z.object({
    order: z.number(),
    action: z.string(),
    target: z.string().optional(),
    value: z.string().optional(),
    expectedOutput: z.string().optional()
  }).optional()
});

export const AIAutoHealSchema = z.object({
  testCaseId: z.string().min(1),
  findingId: z.string().optional(),
  failedStepOrder: z.number().optional(),
  failedSelector: z.string(),
  currentDomSnapshot: z.string(),
  errorMessage: z.string()
});

export const ApproveFixSchema = z.object({
  findingId: z.string().min(1),
  autoApply: z.boolean().default(true),
  patchOverride: z.string().optional(),
  notes: z.string().optional()
});

export const VerifyFixSchema = z.object({
  findingId: z.string().min(1),
  scope: z.enum(['FAILED_TEST_ONLY', 'RELATED_SUITE', 'FULL_REGRESSION']).default('FULL_REGRESSION'),
  environmentId: z.string().optional()
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
export type GenerateTestPlanInput = z.infer<typeof GenerateTestPlanSchema>;
export type BulkTestCaseActionInput = z.infer<typeof BulkTestCaseActionSchema>;
export type UpdatePlannedTestCaseInput = z.infer<typeof UpdatePlannedTestCaseSchema>;

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type CreateEnvironmentInput = z.infer<typeof CreateEnvironmentSchema>;
export type CreateTestSuiteInput = z.infer<typeof CreateTestSuiteSchema>;
export type CreateTestCaseInput = z.infer<typeof CreateTestCaseSchema>;
export type TriggerTestRunInput = z.infer<typeof TriggerTestRunSchema>;
export type AIAnalyzeProjectInput = z.infer<typeof AIAnalyzeProjectSchema>;
export type AIGenerateTestsInput = z.infer<typeof AIGenerateTestsSchema>;
export type AIFailureTriageInput = z.infer<typeof AIFailureTriageSchema>;
export type AIAutoHealInput = z.infer<typeof AIAutoHealSchema>;
export type ApproveFixInput = z.infer<typeof ApproveFixSchema>;
export type VerifyFixInput = z.infer<typeof VerifyFixSchema>;
