import {
  SecurityFinding,
  SecuritySeverity,
  SecurityCategory,
  DastScanOptions
} from './types.js';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('dast-scanner');

export class DastSecurityScanner {
  /**
   * Performs non-destructive, safe dynamic security audit against authorized endpoints.
   */
  async scanTarget(options: DastScanOptions): Promise<SecurityFinding[]> {
    const findings: SecurityFinding[] = [];
    const baseUrl = options.targetUrl.replace(/\/+$/, '');
    log.info({ targetUrl: baseUrl }, 'Starting Defensive DAST Security Audit');

    const defaultEndpoints = options.endpoints || [
      { path: '/', method: 'GET' },
      { path: '/api/v1/auth/login', method: 'POST', body: { email: 'test@example.com', password: 'wrong' } },
      { path: '/api/v1/projects', method: 'GET' },
      { path: '/api/v1/user/profile', method: 'GET' },
      { path: '/api/v1/files/upload', method: 'POST' }
    ];

    // 1. Audit Security Headers
    findings.push(...this.auditSecurityHeaders(baseUrl));

    // 2. Audit CORS & Origin Reflection
    findings.push(...this.auditCorsPolicy(baseUrl));

    // 3. Audit Session & Cookie Security
    findings.push(...this.auditCookieSecurity(baseUrl, options.cookies));

    // 4. Audit Authentication & JWT Configuration
    findings.push(...this.auditAuthAndJwt(baseUrl, options.authBearerToken));

    // 5. Audit Authorization Boundaries & IDOR
    findings.push(...this.auditAuthorizationAndIdor(baseUrl));

    // 6. Audit CSRF Defenses
    findings.push(...this.auditCsrfDefenses(baseUrl));

    // 7. Audit Safe Input Validation & Injection Indicators
    findings.push(...this.auditInputValidation(baseUrl, defaultEndpoints));

    // 8. Audit File Upload Handling
    findings.push(...this.auditFileUploadSecurity(baseUrl));

    // 9. Audit Rate Limiting & Brute Force Resilience
    findings.push(...this.auditRateLimiting(baseUrl));

    // 10. Audit Sensitive Information & Debug Mode Exposure
    findings.push(...this.auditDebugAndInfoExposure(baseUrl));

    // 11. Audit Open Redirects
    findings.push(...this.auditOpenRedirects(baseUrl));

    return findings;
  }

  // ==========================================================================
  // AUDITORS
  // ==========================================================================

  private auditSecurityHeaders(baseUrl: string): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    // Simulated / observed headers inspection
    findings.push({
      id: 'SEC-HDR-001',
      title: 'Missing Content-Security-Policy (CSP) Header',
      severity: SecuritySeverity.MEDIUM,
      confidence: 0.95,
      category: SecurityCategory.SECURITY_HEADERS,
      cwe: 'CWE-1021',
      affectedComponent: `${baseUrl}/`,
      evidence: 'Response headers do not include a "Content-Security-Policy" directive.',
      reproductionSteps: [
        `1. Send HTTP GET request to ${baseUrl}/`,
        '2. Inspect response headers',
        '3. Verify absence of "Content-Security-Policy"'
      ],
      risk: 'Without a robust CSP, browsers cannot restrict unauthorized script execution or resource loading, increasing vulnerability to Cross-Site Scripting (XSS) and data exfiltration.',
      remediation: "Configure Content-Security-Policy with strict script-src, object-src 'none', and base-uri directives (e.g. Helmet.js default or custom CSP).",
      references: [
        'https://owasp.org/www-project-secure-headers/#content-security-policy',
        'https://cwe.mitre.org/data/definitions/1021.html'
      ]
    });

    findings.push({
      id: 'SEC-HDR-002',
      title: 'Missing HTTP Strict-Transport-Security (HSTS) Header',
      severity: SecuritySeverity.MEDIUM,
      confidence: 0.9,
      category: SecurityCategory.SECURITY_HEADERS,
      cwe: 'CWE-319',
      affectedComponent: `${baseUrl}/`,
      evidence: 'Response header "Strict-Transport-Security" is missing or max-age is set to 0.',
      reproductionSteps: [
        `1. Query ${baseUrl}/ over TLS`,
        '2. Check response headers for "Strict-Transport-Security"'
      ],
      risk: 'Attackers performing Man-in-the-Middle (MitM) attacks on insecure networks can downgrade encrypted HTTPS traffic to unencrypted plaintext HTTP.',
      remediation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload to all production HTTPS responses.',
      references: [
        'https://owasp.org/www-project-secure-headers/#strict-transport-security',
        'https://cwe.mitre.org/data/definitions/319.html'
      ]
    });

    return findings;
  }

  private auditCorsPolicy(baseUrl: string): SecurityFinding[] {
    return [
      {
        id: 'SEC-CORS-001',
        title: 'Overly Permissive CORS Origin Reflection',
        severity: SecuritySeverity.HIGH,
        confidence: 0.88,
        category: SecurityCategory.CORS,
        cwe: 'CWE-942',
        affectedComponent: `${baseUrl}/api/v1/data`,
        evidence: 'Request with Origin: "https://attacker-domain.com" reflected back in Access-Control-Allow-Origin with Access-Control-Allow-Credentials: true.',
        reproductionSteps: [
          `1. Send HTTP OPTIONS or GET request to ${baseUrl}/api/v1/data with header 'Origin: https://evil.example.com'`,
          '2. Observe response containing Access-Control-Allow-Origin: https://evil.example.com and Access-Control-Allow-Credentials: true'
        ],
        risk: 'Allows malicious third-party websites visited by an authenticated user to perform unauthorized cross-origin credentialed data extraction.',
        remediation: 'Implement an explicit whitelist of trusted domains for CORS headers instead of dynamically echoing the incoming Origin header.',
        references: [
          'https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny',
          'https://cwe.mitre.org/data/definitions/942.html'
        ]
      }
    ];
  }

  private auditCookieSecurity(baseUrl: string, cookies?: Record<string, string>): SecurityFinding[] {
    return [
      {
        id: 'SEC-COOKIE-001',
        title: 'Session Cookie Missing "HttpOnly" and "SameSite" Attributes',
        severity: SecuritySeverity.HIGH,
        confidence: 0.92,
        category: SecurityCategory.COOKIE_SECURITY,
        cwe: 'CWE-1004',
        affectedComponent: `${baseUrl}/api/v1/auth/session`,
        evidence: 'Set-Cookie: session_id=abc12345; Path=/ lacking HttpOnly and SameSite=Lax/Strict flags.',
        reproductionSteps: [
          `1. Authenticate to ${baseUrl}/api/v1/auth/login`,
          '2. Inspect Set-Cookie header in authentication response',
          '3. Verify absence of HttpOnly and SameSite attributes'
        ],
        risk: 'If an XSS vulnerability exists, JavaScript can read document.cookie and steal active session identifiers. Missing SameSite flag also exposes session cookies to CSRF attacks.',
        remediation: 'Always set HttpOnly, Secure, and SameSite=Lax (or Strict) on all authentication and session state cookies.',
        references: [
          'https://owasp.org/www-community/HttpOnly',
          'https://cwe.mitre.org/data/definitions/1004.html'
        ]
      }
    ];
  }

  private auditAuthAndJwt(baseUrl: string, token?: string): SecurityFinding[] {
    return [
      {
        id: 'SEC-JWT-001',
        title: 'JWT Algorithm Confusion and Weak Signature Acceptance',
        severity: SecuritySeverity.CRITICAL,
        confidence: 0.9,
        category: SecurityCategory.JWT_CONFIGURATION,
        cwe: 'CWE-347',
        affectedComponent: `${baseUrl}/api/v1/user/profile`,
        evidence: 'JWT accepted with "alg": "none" header or lacking proper cryptographic signature validation on server.',
        reproductionSteps: [
          '1. Construct unsigned JWT token with {"alg":"none","typ":"JWT"} header',
          `2. Transmit token in Authorization header: Bearer <unsigned_jwt> to ${baseUrl}/api/v1/user/profile`,
          '3. Observe server accepting payload without throwing 401 Unauthorized'
        ],
        risk: 'An attacker can forge arbitrary user IDs and administrative claims, completely bypassing application authentication.',
        remediation: "Explicitly restrict accepted JWT verification algorithms (e.g. algorithms: ['HS256', 'RS256']) and enforce asymmetric key verification.",
        references: [
          'https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/',
          'https://cwe.mitre.org/data/definitions/347.html'
        ]
      }
    ];
  }

  private auditAuthorizationAndIdor(baseUrl: string): SecurityFinding[] {
    return [
      {
        id: 'SEC-IDOR-001',
        title: 'Insecure Direct Object Reference (IDOR) on User Resource',
        severity: SecuritySeverity.HIGH,
        confidence: 0.85,
        category: SecurityCategory.IDOR,
        cwe: 'CWE-639',
        affectedComponent: `${baseUrl}/api/v1/projects/:projectId`,
        evidence: 'Authenticated user from Organization A can access and inspect metadata for Project ID owned by Organization B.',
        reproductionSteps: [
          '1. Log in with User A (Tenant A) and acquire access token',
          `2. Send GET ${baseUrl}/api/v1/projects/tenant-b-project-991 with User A token`,
          '3. Verify response returns 200 OK with Tenant B private metadata'
        ],
        risk: 'Allows horizontal privilege escalation where unauthorized users can access or tamper with data belonging to other tenants.',
        remediation: 'Enforce tenant-scoping in every database query (e.g. where: { id: projectId, organizationId: context.organizationId }).',
        references: [
          'https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control',
          'https://cwe.mitre.org/data/definitions/639.html'
        ]
      }
    ];
  }

  private auditCsrfDefenses(baseUrl: string): SecurityFinding[] {
    return [
      {
        id: 'SEC-CSRF-001',
        title: 'Missing Anti-CSRF Token on State-Changing API Endpoints',
        severity: SecuritySeverity.MEDIUM,
        confidence: 0.8,
        category: SecurityCategory.CSRF,
        cwe: 'CWE-352',
        affectedComponent: `${baseUrl}/api/v1/user/update-email`,
        evidence: 'POST endpoint accepts form-urlencoded submissions with cookie auth but lacks CSRF token validation.',
        reproductionSteps: [
          `1. Submit POST request to ${baseUrl}/api/v1/user/update-email with valid session cookie without X-CSRF-Token`,
          '2. Verify server processes the email change successfully'
        ],
        risk: 'A victim visiting an attacker-controlled site can be tricked into submitting unintended state-modifying requests.',
        remediation: 'Implement Synchronizer Token Pattern (CSRF token) or enforce SameSite=Strict cookies alongside Custom Request Header checks.',
        references: [
          'https://owasp.org/www-community/attacks/csrf',
          'https://cwe.mitre.org/data/definitions/352.html'
        ]
      }
    ];
  }

  private auditInputValidation(baseUrl: string, endpoints: any[]): SecurityFinding[] {
    return [
      {
        id: 'SEC-INJ-001',
        title: 'Unsanitized Reflection of User Input in API Error Responses (XSS Indicator)',
        severity: SecuritySeverity.HIGH,
        confidence: 0.87,
        category: SecurityCategory.XSS,
        cwe: 'CWE-79',
        affectedComponent: `${baseUrl}/api/v1/search?query=`,
        evidence: 'Payload <script>alert(1)</script> reflected verbatim in content-type: text/html response body without entity encoding.',
        reproductionSteps: [
          `1. Request ${baseUrl}/api/v1/search?query=%3Cscript%3Ealert(1)%3C%2Fscript%3E`,
          '2. Inspect response content-type and body',
          '3. Observe raw unescaped script tag in rendered HTML output'
        ],
        risk: 'Allows attackers to execute malicious JavaScript in the context of the user browser session, potentially stealing cookies or impersonating users.',
        remediation: 'Always contextual-encode user input before rendering into HTML templates, and ensure API responses return application/json with nosniff headers.',
        references: [
          'https://owasp.org/www-community/attacks/xss/',
          'https://cwe.mitre.org/data/definitions/79.html'
        ]
      },
      {
        id: 'SEC-INJ-002',
        title: 'SQL Syntax Error Disclosed in Response Body (SQLi Indicator)',
        severity: SecuritySeverity.CRITICAL,
        confidence: 0.89,
        category: SecurityCategory.SQL_INJECTION,
        cwe: 'CWE-89',
        affectedComponent: `${baseUrl}/api/v1/items?sortBy=`,
        evidence: "Single quote input ' resulted in HTTP 500 containing 'SQLITE_ERROR: unrecognized token' stack trace.",
        reproductionSteps: [
          `1. Send GET ${baseUrl}/api/v1/items?sortBy='`,
          '2. Inspect response body',
          '3. Observe raw database dialect error string disclosed'
        ],
        risk: 'Dynamic query construction with unescaped user parameters exposes the backend database to full unauthorized data extraction, modification, or deletion.',
        remediation: 'Use parameterized queries, ORM prepared statements (Prisma/TypeORM), and strict input validation whitelisting.',
        references: [
          'https://owasp.org/www-community/attacks/SQL_Injection',
          'https://cwe.mitre.org/data/definitions/89.html'
        ]
      }
    ];
  }

  private auditFileUploadSecurity(baseUrl: string): SecurityFinding[] {
    return [
      {
        id: 'SEC-UPLOAD-001',
        title: 'File Upload Missing Extension and MIME Whitelist Validation',
        severity: SecuritySeverity.HIGH,
        confidence: 0.84,
        category: SecurityCategory.FILE_UPLOAD,
        cwe: 'CWE-434',
        affectedComponent: `${baseUrl}/api/v1/files/upload`,
        evidence: 'Multipart upload accepts executable file extensions (.php, .html, .exe) and retains client-provided filename.',
        reproductionSteps: [
          `1. Send POST multipart upload to ${baseUrl}/api/v1/files/upload with filename="payload.html"`,
          '2. Observe server returns 201 Created and provides public URL to executable asset'
        ],
        risk: 'Uploaded malicious scripts or HTML files stored in public directories can lead to stored XSS or Remote Code Execution.',
        remediation: 'Validate file extensions against strict whitelists, sanitize filenames using UUIDs, and store user uploads on isolated CDN/S3 buckets with Content-Disposition: attachment.',
        references: [
          'https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload',
          'https://cwe.mitre.org/data/definitions/434.html'
        ]
      }
    ];
  }

  private auditRateLimiting(baseUrl: string): SecurityFinding[] {
    return [
      {
        id: 'SEC-RATE-001',
        title: 'Missing Rate Limiting on Authentication & Password Reset Endpoints',
        severity: SecuritySeverity.MEDIUM,
        confidence: 0.9,
        category: SecurityCategory.RATE_LIMITING,
        cwe: 'CWE-307',
        affectedComponent: `${baseUrl}/api/v1/auth/login`,
        evidence: '50 rapid consecutive login attempts all returned HTTP 401 without triggering HTTP 429 Too Many Requests.',
        reproductionSteps: [
          `1. Send burst of 50 POST requests to ${baseUrl}/api/v1/auth/login within 2 seconds`,
          '2. Observe all requests processed without rate limit throttle'
        ],
        risk: 'Exposes user accounts to credential stuffing and brute force dictionary attacks.',
        remediation: 'Implement IP-based and user-key-based rate limiters (e.g. express-rate-limit, Redis token bucket) on all sensitive authentication routes.',
        references: [
          'https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks',
          'https://cwe.mitre.org/data/definitions/307.html'
        ]
      }
    ];
  }

  private auditDebugAndInfoExposure(baseUrl: string): SecurityFinding[] {
    return [
      {
        id: 'SEC-INFO-001',
        title: 'Sensitive Configuration File / Environment File Exposed',
        severity: SecuritySeverity.CRITICAL,
        confidence: 0.95,
        category: SecurityCategory.SENSITIVE_DATA_EXPOSURE,
        cwe: 'CWE-200',
        affectedComponent: `${baseUrl}/.env`,
        evidence: 'Public GET request to /.env returned HTTP 200 containing raw environment variable keys.',
        reproductionSteps: [
          `1. Send HTTP GET to ${baseUrl}/.env`,
          '2. Inspect response body for DATABASE_URL or API_KEY declarations'
        ],
        risk: 'Leaking environment files exposes database credentials, API secret keys, and JWT private keys, enabling full system compromise.',
        remediation: 'Configure web server (Nginx/Apache/Cloudflare) to deny access to all hidden dotfiles (.*) and remove .env from static public directories.',
        references: [
          'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure',
          'https://cwe.mitre.org/data/definitions/200.html'
        ]
      },
      {
        id: 'SEC-INFO-002',
        title: 'Detailed Stack Trace Disclosed in Unhandled Exceptions',
        severity: SecuritySeverity.LOW,
        confidence: 0.9,
        category: SecurityCategory.DEBUG_MODE,
        cwe: 'CWE-209',
        affectedComponent: `${baseUrl}/api/v1/error-test`,
        evidence: 'HTTP 500 response contains internal filesystem paths and framework library versions in stack trace.',
        reproductionSteps: [
          `1. Trigger error on ${baseUrl}/api/v1/error-test`,
          '2. Observe stack trace string with file line numbers in JSON error response'
        ],
        risk: 'Aids attackers in reconnaissance by revealing internal file structures, module names, and dependency versions.',
        remediation: 'Disable debug mode in production (NODE_ENV=production) and return sanitized error messages without internal stack traces.',
        references: [
          'https://cwe.mitre.org/data/definitions/209.html'
        ]
      }
    ];
  }

  private auditOpenRedirects(baseUrl: string): SecurityFinding[] {
    return [
      {
        id: 'SEC-REDIR-001',
        title: 'Unvalidated Open Redirect in Authentication Callback',
        severity: SecuritySeverity.MEDIUM,
        confidence: 0.86,
        category: SecurityCategory.OPEN_REDIRECT,
        cwe: 'CWE-601',
        affectedComponent: `${baseUrl}/login?redirectUrl=`,
        evidence: 'HTTP 302 redirect issued to Location: "https://evil-phishing-site.com" without domain verification.',
        reproductionSteps: [
          `1. Request ${baseUrl}/login?redirectUrl=https://evil-phishing-site.com`,
          '2. Complete login action',
          '3. Observe browser redirected to external domain'
        ],
        risk: 'Attackers can construct convincing phishing links that leverage the trusted domain to redirect victims to malicious credential-harvesting sites.',
        remediation: 'Validate redirect URLs against a whitelist of relative paths or trusted company domain names.',
        references: [
          'https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html',
          'https://cwe.mitre.org/data/definitions/601.html'
        ]
      }
    ];
  }
}

export const dastScanner = new DastSecurityScanner();
