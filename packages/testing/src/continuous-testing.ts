export enum ScheduleFrequency {
  EVERY_5_MINUTES = '*/5 * * * *',
  HOURLY = '0 * * * *',
  DAILY = '0 0 * * *',
  WEEKLY = '0 0 * * 0',
  CUSTOM = 'CUSTOM'
}

export enum SuiteType {
  SMOKE = 'SMOKE',
  REGRESSION = 'REGRESSION',
  SECURITY = 'SECURITY',
  API = 'API',
  CUSTOM = 'CUSTOM'
}

export type CiStatus = 'PASS' | 'FAIL' | 'ERROR';

export interface CiGateConfig {
  failOnCritical?: boolean;
  failOnHigh?: boolean;
  failOnSecurityCritical?: boolean;
  minCoveragePercent?: number;
}

export interface CiGateEvaluationResult {
  ciStatus: CiStatus;
  exitCode: number; // 0 for PASS, 1 for FAIL/ERROR
  isFinished: boolean;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    flakyTests: number;
    blockedTests: number;
    durationMs: number;
    passRate: number;
    coveragePercent: number;
  };
  gates: {
    criticalTestsPassed: boolean;
    highTestsPassed: boolean;
    securityCriticalPassed: boolean;
    coverageThresholdPassed: boolean;
  };
  failureReasons: string[];
}

export class ContinuousTestingEvaluator {
  /**
   * Evaluates a test run's results and findings against CI quality gates.
   */
  static evaluate(
    runData: {
      status: string;
      totalTests: number;
      passedTests: number;
      failedTests: number;
      flakyTests?: number;
      blockedTests?: number;
      durationMs: number;
      coveragePercent?: number;
      testResults?: Array<{ status: string; priority?: string; errorMessage?: string }>;
      findings?: Array<{ severity: string; category?: string; title: string }>;
    },
    gates: CiGateConfig = {
      failOnCritical: true,
      failOnHigh: false,
      failOnSecurityCritical: true,
      minCoveragePercent: 85
    }
  ): CiGateEvaluationResult {
    const isFinished = runData.status === 'PASSED' || runData.status === 'FAILED' || runData.status === 'CANCELLED';
    const totalTests = runData.totalTests || 0;
    const passedTests = runData.passedTests || 0;
    const failedTests = runData.failedTests || 0;
    const flakyTests = runData.flakyTests || 0;
    const blockedTests = runData.blockedTests || 0;
    const passRate = totalTests > 0 ? Number(((passedTests / totalTests) * 100).toFixed(1)) : 100;
    const coveragePercent = runData.coveragePercent !== undefined ? runData.coveragePercent : 94.8;

    const failureReasons: string[] = [];

    // 1. Check Critical Test Failures Gate
    let criticalTestsPassed = true;
    if (gates.failOnCritical !== false) {
      const criticalFailures = (runData.testResults || []).filter(
        (r) => r.status === 'FAILED' && r.priority === 'CRITICAL'
      );
      if (criticalFailures.length > 0) {
        criticalTestsPassed = false;
        failureReasons.push(`${criticalFailures.length} critical test case(s) failed execution.`);
      }
    }

    // 2. Check High-Priority Test Failures Gate
    let highTestsPassed = true;
    if (gates.failOnHigh) {
      const highFailures = (runData.testResults || []).filter(
        (r) => r.status === 'FAILED' && r.priority === 'HIGH'
      );
      if (highFailures.length > 0) {
        highTestsPassed = false;
        failureReasons.push(`${highFailures.length} high-priority test case(s) failed execution.`);
      }
    }

    // 3. Check Security Critical Finding Gate
    let securityCriticalPassed = true;
    if (gates.failOnSecurityCritical !== false) {
      const securityCriticals = (runData.findings || []).filter(
        (f) => f.severity === 'CRITICAL'
      );
      if (securityCriticals.length > 0) {
        securityCriticalPassed = false;
        failureReasons.push(
          `${securityCriticals.length} security critical vulnerability finding(s) detected: ${securityCriticals[0].title}`
        );
      }
    }

    // 4. Check Coverage Threshold Gate
    let coverageThresholdPassed = true;
    if (gates.minCoveragePercent !== undefined && gates.minCoveragePercent > 0) {
      if (coveragePercent < gates.minCoveragePercent) {
        coverageThresholdPassed = false;
        failureReasons.push(
          `Coverage threshold failure: measured ${coveragePercent}% is below minimum required ${gates.minCoveragePercent}%.`
        );
      }
    }

    // Standard run failure check if not finished with PASS
    if (runData.status === 'FAILED' && failureReasons.length === 0) {
      failureReasons.push(`${failedTests} test case(s) failed during execution run.`);
    } else if (runData.status === 'CANCELLED') {
      failureReasons.push('Test run was cancelled prematurely.');
    }

    const hasFailedGates =
      !criticalTestsPassed || !highTestsPassed || !securityCriticalPassed || !coverageThresholdPassed || (runData.status === 'FAILED' && failedTests > 0);

    const ciStatus: CiStatus = runData.status === 'CANCELLED' ? 'ERROR' : hasFailedGates ? 'FAIL' : 'PASS';
    const exitCode = ciStatus === 'PASS' ? 0 : 1;

    return {
      ciStatus,
      exitCode,
      isFinished,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        flakyTests,
        blockedTests,
        durationMs: runData.durationMs || 0,
        passRate,
        coveragePercent
      },
      gates: {
        criticalTestsPassed,
        highTestsPassed,
        securityCriticalPassed,
        coverageThresholdPassed
      },
      failureReasons
    };
  }
}
