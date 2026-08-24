import { describe, it, expect } from 'vitest';
import {
  dastScanner,
  sastScanner,
  securityOrchestrator,
  SecuritySeverity,
  SecurityCategory
} from './index.js';

describe('Defensive Application Security Testing Module (@novaqa/security)', () => {
  describe('1. Dynamic API & Web Security Scanner (DAST)', () => {
    it('should perform non-destructive audit and identify security headers and cookie issues', async () => {
      const findings = await dastScanner.scanTarget({
        targetUrl: 'http://localhost:3000'
      });

      expect(findings.length).toBeGreaterThan(5);

      // Verify header checks
      const cspFinding = findings.find((f) => f.id === 'SEC-HDR-001');
      expect(cspFinding).toBeDefined();
      expect(cspFinding?.category).toBe(SecurityCategory.SECURITY_HEADERS);
      expect(cspFinding?.cwe).toBe('CWE-1021');
      expect(cspFinding?.remediation).toBeDefined();
      expect(cspFinding?.reproductionSteps.length).toBeGreaterThan(0);

      // Verify cookie checks
      const cookieFinding = findings.find((f) => f.id === 'SEC-COOKIE-001');
      expect(cookieFinding).toBeDefined();
      expect(cookieFinding?.cwe).toBe('CWE-1004');

      // Verify JWT checks
      const jwtFinding = findings.find((f) => f.id === 'SEC-JWT-001');
      expect(jwtFinding).toBeDefined();
      expect(jwtFinding?.severity).toBe(SecuritySeverity.CRITICAL);
      expect(jwtFinding?.cwe).toBe('CWE-347');

      // Verify IDOR check
      const idorFinding = findings.find((f) => f.id === 'SEC-IDOR-001');
      expect(idorFinding).toBeDefined();
      expect(idorFinding?.cwe).toBe('CWE-639');
    });

    it('should identify injection indicators and sensitive data exposures with CWE references', async () => {
      const findings = await dastScanner.scanTarget({
        targetUrl: 'http://localhost:3000'
      });

      const sqliFinding = findings.find((f) => f.id === 'SEC-INJ-002');
      expect(sqliFinding).toBeDefined();
      expect(sqliFinding?.cwe).toBe('CWE-89');
      expect(sqliFinding?.severity).toBe(SecuritySeverity.CRITICAL);

      const envFinding = findings.find((f) => f.id === 'SEC-INFO-001');
      expect(envFinding).toBeDefined();
      expect(envFinding?.cwe).toBe('CWE-200');
    });
  });

  describe('2. Static Source Code Security Scanner (SAST)', () => {
    it('should detect hardcoded cloud credentials, tokens, and private keys in source files', async () => {
      const codeSamples = [
        {
          path: 'src/config/aws.ts',
          content: 'const awsKey = "AKIA1234567890ABCDEF";'
        },
        {
          path: 'src/services/github.ts',
          content: 'const ghToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";'
        },
        {
          path: 'src/payments/stripe.ts',
          content: 'const stripeSecret = "sk_live_1234567890abcdef12345678";'
        },
        {
          path: 'src/database/db.ts',
          content: 'const dbUrl = "postgres://admin:SuperSecretPass123!@db.internal:5432/production";'
        }
      ];

      const findings = await sastScanner.scanSource({ fileContents: codeSamples });
      expect(findings.length).toBe(4);

      expect(findings.some((f) => f.title.includes('AWS Access Key'))).toBe(true);
      expect(findings.some((f) => f.title.includes('GitHub Personal Access Token'))).toBe(true);
      expect(findings.some((f) => f.title.includes('Stripe Live Secret Key'))).toBe(true);
      expect(findings.some((f) => f.title.includes('Database Connection String'))).toBe(true);
      expect(findings.every((f) => f.cwe === 'CWE-798')).toBe(true);
    });

    it('should detect dangerous functions, command injections, and unsafe deserialization', async () => {
      const vulnerableSource = [
        {
          path: 'src/eval-handler.ts',
          content: 'const result = eval(userExpr);'
        },
        {
          path: 'src/shell-runner.ts',
          content: 'import { exec } from "child_process"; exec("ping " + host);'
        },
        {
          path: 'src/deserializer.ts',
          content: 'const obj = unserialize(rawInput);'
        },
        {
          path: 'src/file-server.ts',
          content: 'const data = fs.readFileSync(req.query.path);'
        }
      ];

      const findings = await sastScanner.scanSource({ fileContents: vulnerableSource });
      expect(findings.length).toBe(4);

      const cmdInj = findings.find((f) => f.cwe === 'CWE-78');
      expect(cmdInj).toBeDefined();
      expect(cmdInj?.severity).toBe(SecuritySeverity.CRITICAL);

      const deser = findings.find((f) => f.cwe === 'CWE-502');
      expect(deser).toBeDefined();
      expect(deser?.severity).toBe(SecuritySeverity.CRITICAL);
    });
  });

  describe('3. Unified Security Orchestrator & Posture Grading', () => {
    it('should run full audit, compute posture score, and calculate letter grade', async () => {
      const summary = await securityOrchestrator.runAudit({
        targetUrl: 'http://localhost:3000',
        fileContents: [
          { path: 'src/clean.ts', content: 'export const status = "secure";' }
        ]
      });

      expect(summary.auditId).toBeDefined();
      expect(summary.totalFindings).toBeGreaterThan(0);
      expect(summary.overallPostureScore).toBeGreaterThanOrEqual(0);
      expect(summary.overallPostureScore).toBeLessThanOrEqual(100);
      expect(['A+', 'A', 'B', 'C', 'D', 'F']).toContain(summary.postureGrade);
      expect(summary.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
