export enum SecuritySeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFORMATIONAL = 'INFORMATIONAL'
}

export enum SecurityCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  RBAC = 'RBAC',
  IDOR = 'IDOR',
  CSRF = 'CSRF',
  CORS = 'CORS',
  SECURITY_HEADERS = 'SECURITY_HEADERS',
  SESSION_MANAGEMENT = 'SESSION_MANAGEMENT',
  COOKIE_SECURITY = 'COOKIE_SECURITY',
  INPUT_VALIDATION = 'INPUT_VALIDATION',
  SQL_INJECTION = 'SQL_INJECTION',
  XSS = 'XSS',
  COMMAND_INJECTION = 'COMMAND_INJECTION',
  PATH_TRAVERSAL = 'PATH_TRAVERSAL',
  SSRF = 'SSRF',
  FILE_UPLOAD = 'FILE_UPLOAD',
  RATE_LIMITING = 'RATE_LIMITING',
  JWT_CONFIGURATION = 'JWT_CONFIGURATION',
  SENSITIVE_DATA_EXPOSURE = 'SENSITIVE_DATA_EXPOSURE',
  DEBUG_MODE = 'DEBUG_MODE',
  SECRET_EXPOSURE = 'SECRET_EXPOSURE',
  OPEN_REDIRECT = 'OPEN_REDIRECT',
  INSECURE_API_ENDPOINT = 'INSECURE_API_ENDPOINT',
  SAST_HARDCODED_SECRET = 'SAST_HARDCODED_SECRET',
  SAST_DANGEROUS_FUNCTION = 'SAST_DANGEROUS_FUNCTION',
  SAST_UNSAFE_DESERIALIZATION = 'SAST_UNSAFE_DESERIALIZATION',
  SAST_INSECURE_CRYPTO = 'SAST_INSECURE_CRYPTO',
  SAST_UNSAFE_FILE_OP = 'SAST_UNSAFE_FILE_OP',
  DEPENDENCY_VULNERABILITY = 'DEPENDENCY_VULNERABILITY'
}

export interface SecurityFinding {
  id: string;
  title: string;
  severity: SecuritySeverity;
  confidence: number; // 0.0 to 1.0
  category: SecurityCategory | string;
  cwe?: string; // e.g. "CWE-79", "CWE-89", "CWE-798"
  affectedComponent: string; // URL endpoint, parameter, or source file path + line
  evidence: string; // Request/Response or Code snippet
  reproductionSteps: string[];
  risk: string; // Explaining impact and theoretical exploitation vector
  remediation: string; // Clear, concrete, actionable mitigation advice
  references: string[]; // OWASP, CWE, RFC references
  verified?: boolean;
  status?: 'OPEN' | 'RESOLVED' | 'FALSE_POSITIVE' | 'MUTED';
}

export interface DastScanOptions {
  targetUrl: string;
  endpoints?: Array<{ path: string; method: string; headers?: Record<string, string>; body?: any }>;
  headers?: Record<string, string>;
  authBearerToken?: string;
  cookies?: Record<string, string>;
  deepScan?: boolean;
}

export interface SastScanOptions {
  sourceDirectory?: string;
  fileContents?: Array<{ path: string; content: string }>;
  includeDependencies?: boolean;
}

export interface SecurityAuditSummary {
  auditId: string;
  targetUrl?: string;
  sourceDirectory?: string;
  scannedEndpointsCount: number;
  scannedFilesCount: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  informationalCount: number;
  overallPostureScore: number; // 0 to 100
  postureGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  findings: SecurityFinding[];
  durationMs: number;
  timestamp: string;
}
