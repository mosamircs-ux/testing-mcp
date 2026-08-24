export enum ReportType {
  TEST_EXECUTION = 'TEST_EXECUTION',
  REGRESSION = 'REGRESSION',
  RELEASE = 'RELEASE',
  SECURITY = 'SECURITY',
  COVERAGE = 'COVERAGE',
  API = 'API',
  MOBILE = 'MOBILE',
  PERFORMANCE = 'PERFORMANCE'
}

export enum ReportFormat {
  PDF = 'PDF',
  HTML = 'HTML',
  JSON = 'JSON',
  CSV = 'CSV'
}

export interface ReportIssue {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  impact: string;
  remediation?: string;
}

export interface ReportScreenshot {
  name: string;
  url: string;
  caption: string;
  stepOrder?: number;
  timestamp?: string;
}

export interface ReportEvidence {
  title: string;
  excerpt: string;
  logType: 'CONSOLE' | 'NETWORK' | 'LOGCAT' | 'STACK_TRACE' | 'DOM_DIFF';
  timestamp?: string;
}

export interface ReportCoverageMetrics {
  routeCoverage: number; // 0 to 100
  apiCoverage: number; // 0 to 100
  requirementCoverage: number; // 0 to 100
  overall: number; // 0 to 100
}

export interface ProfessionalReport {
  id: string;
  title: string;
  reportType: ReportType;
  projectId: string;
  projectName: string;
  testRunId?: string;
  executiveSummary: string;
  environment: {
    name: string;
    baseUrl: string;
    tier: string;
  };
  applicationVersion: string;
  testsExecuted: number;
  passedTests: number;
  failedTests: number;
  flakyTests: number;
  blockedTests: number;
  passRate: number; // percentage
  failureRate: number; // percentage
  flakyRate: number; // percentage
  durationMs: number;
  coverage: ReportCoverageMetrics;
  criticalIssues: ReportIssue[];
  highIssues: ReportIssue[];
  screenshots: ReportScreenshot[];
  evidence: ReportEvidence[];
  recommendations: string[];
  shareToken: string;
  createdAt: string;
}

export interface ComparisonRequest {
  runAId: string;
  runBId: string;
  projectId?: string;
}

export interface ComparisonResult {
  runA: {
    id: string;
    version: string;
    createdAt: string;
    passRate: number;
    durationMs: number;
  };
  runB: {
    id: string;
    version: string;
    createdAt: string;
    passRate: number;
    durationMs: number;
  };
  summary: {
    statusDelta: 'IMPROVED' | 'REGRESSED' | 'STABLE';
    passRateDelta: number;
    durationDeltaMs: number;
  };
  newFailures: Array<{ id: string; title: string; category: string; error?: string }>;
  resolvedFailures: Array<{ id: string; title: string; category: string }>;
  regressions: Array<{ id: string; title: string; severity: string; rootCause: string }>;
  newTests: Array<{ id: string; title: string; category: string }>;
  removedTests: Array<{ id: string; title: string }>;
  coverageChanges: {
    previousOverall: number;
    currentOverall: number;
    delta: number;
    details: string;
  };
  performanceChanges: {
    previousP95Ms: number;
    currentP95Ms: number;
    deltaMs: number;
    throughputDeltaPercent: number;
  };
  securityChanges: {
    previousScore: number;
    currentScore: number;
    newVulnerabilitiesCount: number;
    resolvedVulnerabilitiesCount: number;
  };
}
