import { AIClient, aiClient } from './client';
import { prisma } from '@novaqa/database';
import {
  AIFailureTriageInput,
  FindingCategory,
  FindingSeverity,
  FailureEvidence,
  SelfHealType
} from '@novaqa/types';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('ai-failure-analyzer');

export interface FailureAnalysisResult {
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  rootCauseAnalysis: string;
  suggestedFix: string;
  suggestedPatch?: string | null;
  autoHealSelector?: string | null;
  confidence: number;
  evidence: FailureEvidence;
  affectedFiles: string[];
  affectedCode: string[];
  regressionRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  isSelfHealEligible: boolean;
  selfHealType?: SelfHealType;
}

export class FailureAnalyzer {
  constructor(private client: AIClient = aiClient) {}

  /**
   * Deep multi-signal failure analysis across:
   * test step, screenshot, DOM snapshot, console logs, network/API calls,
   * stack trace, app logs, previous successful runs, and test history.
   */
  async analyzeFailure(input: AIFailureTriageInput): Promise<FailureAnalysisResult> {
    log.info({ testResultId: input.testResultId }, 'Starting deep AI failure analysis');

    // 1. Gather all evidence signals (either from input or by querying database artifacts)
    const evidence = await this.enrichEvidence(input);

    // 2. Perform rule-based heuristics to identify strong pattern matches
    const heuristicResult = this.heuristicClassification(input.errorMessage, input.stackTrace, evidence);

    // 3. Construct rich LLM prompt with all diagnostic evidence
    const systemPrompt = `You are a Principal Software Reliability & Root Cause Analysis AI Engineer.
You analyze end-to-end and API test failures across all captured signals:
- Test step actions & targets
- DOM HTML structure & element hierarchy
- Browser console warnings & uncaught errors
- Network requests, status codes & payload sizes
- Stack traces & backend API responses
- Historical run flakiness & regression history

You MUST classify the failure into exactly ONE of the following 10 categories:
1. 'REAL_BUG' - Genuine application defect, unhandled 500 error, business logic error, unhandled exception in product code, or assertion failure where application violated specifications.
2. 'TEST_FLAKINESS' - Intermittent race conditions, rendering delays, animations not settled, intermittent network timing where retry succeeded.
3. 'SELECTOR_DRIFT' - UI changed classes, IDs, or structure, but target functionality still exists in DOM under a different locator.
4. 'TIMING_ISSUE' - Premature timeout waiting for async element/network, p95 latency exceeded, or missing explicit wait condition.
5. 'NETWORK_ISSUE' - DNS resolution failure, connection refused, 502/503/504 gateway errors, socket timeout, CORS abort.
6. 'ENVIRONMENT_ISSUE' - Incorrect base URL, missing env variable, SSL cert error, infrastructure or container unavailability.
7. 'DATA_ISSUE' - Missing seed data, expired test credentials, duplicate entity conflict, unexpected empty database state.
8. 'AUTHENTICATION_ISSUE' - 401 Unauthorized, expired JWT, invalid API key, missing cookie session.
9. 'PERMISSION_ISSUE' - 403 Forbidden, RBAC authorization failure, missing scope or role capabilities.
10. 'UNKNOWN' - Insufficient diagnostic evidence to classify.

CRITICAL SELF-HEALING SAFETY RULES:
- ONLY non-semantic test maintenance (SELECTOR_DRIFT, TIMING_ISSUE, and safe RETRY_TUNING) may be eligible for automatic self-healing.
- NEVER mark REAL_BUG, DATA_ISSUE, AUTHENTICATION_ISSUE, or PERMISSION_ISSUE as auto-healable. Doing so hides genuine product bugs.

Return ONLY valid JSON matching this schema:
{
  "category": "REAL_BUG" | "TEST_FLAKINESS" | "SELECTOR_DRIFT" | "TIMING_ISSUE" | "NETWORK_ISSUE" | "ENVIRONMENT_ISSUE" | "DATA_ISSUE" | "AUTHENTICATION_ISSUE" | "PERMISSION_ISSUE" | "UNKNOWN",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
  "title": string,
  "rootCauseAnalysis": string,
  "suggestedFix": string,
  "suggestedPatch": string | null,
  "autoHealSelector": string | null,
  "confidence": number (between 0.0 and 1.0),
  "affectedFiles": string[],
  "affectedCode": string[],
  "regressionRisk": "HIGH" | "MEDIUM" | "LOW"
}`;

    const userPrompt = `action: triage_failure\nErrorMessage: ${input.errorMessage}\n` +
      `StackTrace: ${input.stackTrace || 'None'}\n` +
      `FailedStep: ${JSON.stringify(evidence.failedStep || input.failedStepDetails || {})}\n` +
      `DOMSnippet: ${evidence.domSnapshotSnippet ? evidence.domSnapshotSnippet.slice(0, 1500) : (input.domSnapshot ? input.domSnapshot.slice(0, 1500) : 'None')}\n` +
      `ConsoleErrors: ${JSON.stringify(evidence.consoleErrors || input.consoleOutput || [])}\n` +
      `NetworkFailures: ${JSON.stringify(evidence.networkFailures || input.networkCalls || [])}\n` +
      `ApiResponses: ${JSON.stringify(evidence.apiResponses || [])}\n` +
      `HistoricalFlakinessScore: ${evidence.historicalFlakinessScore ?? 0}\n` +
      `RecentRunHistory: ${JSON.stringify(evidence.recentRunHistory || input.previousRunResults || [])}\n` +
      `HeuristicPreClassification: ${heuristicResult ? heuristicResult.category : 'Undetermined'}`;

    const response = await this.client.generate<any>({
      systemPrompt,
      userPrompt,
      responseFormat: 'json',
      temperature: 0.1
    });

    let result: any = response.parsed;

    if (!result || !result.category) {
      result = heuristicResult || this.fallbackAnalysis(input, evidence);
    }

    // Determine safe self-healing eligibility
    const { isSelfHealEligible, selfHealType } = this.determineSelfHealEligibility(
      result.category as FindingCategory,
      evidence,
      result.autoHealSelector
    );

    return {
      category: result.category as FindingCategory,
      severity: (result.severity as FindingSeverity) || FindingSeverity.HIGH,
      title: result.title || `Failure in test execution: ${input.errorMessage.slice(0, 60)}`,
      rootCauseAnalysis: result.rootCauseAnalysis || input.errorMessage,
      suggestedFix: result.suggestedFix || 'Review failing test step and application logs.',
      suggestedPatch: result.suggestedPatch || null,
      autoHealSelector: result.autoHealSelector || null,
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.85,
      evidence,
      affectedFiles: Array.isArray(result.affectedFiles) ? result.affectedFiles : [],
      affectedCode: Array.isArray(result.affectedCode) ? result.affectedCode : [],
      regressionRisk: (result.regressionRisk as 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM',
      isSelfHealEligible,
      selfHealType
    };
  }

  /**
   * Enriches evidence by fetching stored artifacts (Screenshots, DOM, HAR, Console) and run history
   */
  async enrichEvidence(input: AIFailureTriageInput): Promise<FailureEvidence> {
    const evidence: FailureEvidence = {
      screenshotUrls: input.screenshotUrls || [],
      domSnapshotSnippet: input.domSnapshot,
      consoleErrors: input.consoleOutput?.map((c) => ({ level: c.level, message: c.message, timestamp: c.timestamp })) || [],
      networkFailures: (input.networkCalls as any[]) || [],
      apiResponses: input.apiResponses?.map((a) => ({ url: a.url, method: a.method, status: a.status, bodySnippet: a.body?.slice(0, 300), durationMs: a.durationMs })) || [],
      stackTrace: input.stackTrace,
      applicationLogs: input.applicationLogs || [],
      failedStep: input.failedStepDetails,
      recentRunHistory: input.previousRunResults
    };

    if (input.testResultId) {
      try {
        const testResult = await prisma.testResult.findUnique({
          where: { id: input.testResultId },
          include: {
            testCase: { include: { steps: true } },
            artifacts: true,
            testRun: { include: { environment: true, project: true } }
          }
        });

        if (testResult) {
          // 1. Extract artifacts
          for (const art of testResult.artifacts) {
            if (art.type === 'SCREENSHOT' && art.storageUrl) {
              evidence.screenshotUrls = evidence.screenshotUrls || [];
              if (!evidence.screenshotUrls.includes(art.storageUrl)) {
                evidence.screenshotUrls.push(art.storageUrl);
              }
            } else if (art.type === 'DOM_SNAPSHOT' && !evidence.domSnapshotSnippet) {
              try {
                const meta = typeof art.metadata === 'string' ? JSON.parse(art.metadata) : art.metadata;
                evidence.domSnapshotSnippet = meta?.snippet || meta?.content || art.fileName;
              } catch {}
            } else if (art.type === 'CONSOLE_LOG' && (!evidence.consoleErrors || evidence.consoleErrors.length === 0)) {
              try {
                const meta = typeof art.metadata === 'string' ? JSON.parse(art.metadata) : art.metadata;
                if (Array.isArray(meta?.logs)) {
                  evidence.consoleErrors = meta.logs.filter((l: any) => l.level === 'error' || l.level === 'warn');
                }
              } catch {}
            } else if (art.type === 'NETWORK_HAR' && (!evidence.networkFailures || evidence.networkFailures.length === 0)) {
              try {
                const meta = typeof art.metadata === 'string' ? JSON.parse(art.metadata) : art.metadata;
                if (Array.isArray(meta?.entries)) {
                  evidence.networkFailures = meta.entries.filter((e: any) => e.status >= 400 || e.failed);
                }
              } catch {}
            }
          }

          // 2. Extract step details
          if (!evidence.failedStep && testResult.testCase) {
            try {
              const parsedSteps = typeof testResult.stepResults === 'string'
                ? JSON.parse(testResult.stepResults)
                : (testResult.stepResults as any);
              const failedStepResult = Array.isArray(parsedSteps) ? parsedSteps.find((s: any) => s.status === 'FAILED') : null;
              if (failedStepResult) {
                const matchingDef = testResult.testCase.steps.find((s) => s.order === failedStepResult.order);
                evidence.failedStep = {
                  order: failedStepResult.order,
                  action: matchingDef?.action || failedStepResult.action || 'UNKNOWN',
                  target: matchingDef?.target || failedStepResult.target || undefined,
                  value: matchingDef?.value || failedStepResult.value || undefined,
                  expectedOutput: matchingDef?.expectedOutput || undefined,
                  error: failedStepResult.error || testResult.errorMessage || undefined
                };
              }
            } catch {}
          }

          // 3. Historical run and flakiness metrics
          if (testResult.testCase) {
            evidence.historicalFlakinessScore = testResult.testCase.flakinessScore;

            const previousResults = await prisma.testResult.findMany({
              where: { testCaseId: testResult.testCaseId, id: { not: testResult.id } },
              orderBy: { startedAt: 'desc' },
              take: 5,
              select: { id: true, testRunId: true, status: true, durationMs: true, startedAt: true }
            });

            evidence.recentRunHistory = previousResults.map((pr) => ({
              runId: pr.testRunId,
              status: pr.status,
              durationMs: pr.durationMs,
              timestamp: (pr.startedAt || new Date()).toISOString()
            }));
          }
        }
      } catch (err: any) {
        log.warn({ err: err.message }, 'Could not enrich evidence from database');
      }
    }

    return evidence;
  }

  /**
   * Deterministic pattern matching rules for fast classification
   */
  private heuristicClassification(
    errorMessage: string,
    stackTrace?: string,
    evidence?: FailureEvidence
  ): { category: FindingCategory; severity: FindingSeverity; title: string; rootCauseAnalysis: string; suggestedFix: string; suggestedPatch?: string | null; autoHealSelector?: string | null; confidence: number; affectedFiles: string[]; affectedCode: string[]; regressionRisk: 'HIGH' | 'MEDIUM' | 'LOW' } | null {
    const err = (errorMessage || '').toLowerCase();
    const stack = (stackTrace || '').toLowerCase();

    // 1. Permission Issues (403 / Forbidden / Role)
    if (err.includes('403') || err.includes('forbidden') || err.includes('lacks') || err.includes('permission denied')) {
      return {
        category: FindingCategory.PERMISSION_ISSUE,
        severity: FindingSeverity.HIGH,
        title: 'Authorization & RBAC Permission Violation (HTTP 403)',
        rootCauseAnalysis: `The test execution attempted an action forbidden for the authenticated role. Error: ${errorMessage}`,
        suggestedFix: 'Verify the test user token possesses the required role permission or adjust the route RBAC policy.',
        suggestedPatch: null,
        autoHealSelector: null,
        confidence: 0.95,
        affectedFiles: ['src/middleware/auth.ts'],
        affectedCode: ['requirePermission(...)'],
        regressionRisk: 'HIGH'
      };
    }

    // 2. Authentication Issues (401 / Unauthorized / Token Expired)
    if (err.includes('401') || err.includes('unauthorized') || err.includes('jwt expired') || err.includes('invalid token')) {
      return {
        category: FindingCategory.AUTHENTICATION_ISSUE,
        severity: FindingSeverity.HIGH,
        title: 'Authentication Credentials Expired or Invalid (HTTP 401)',
        rootCauseAnalysis: `The endpoint rejected the request due to missing or expired authentication tokens: ${errorMessage}`,
        suggestedFix: 'Ensure session token rotation lifecycle is executed before calling protected endpoints.',
        suggestedPatch: null,
        autoHealSelector: null,
        confidence: 0.96,
        affectedFiles: ['packages/auth/src/token.ts'],
        affectedCode: ['TokenService.verifyAccessToken(...)'],
        regressionRisk: 'MEDIUM'
      };
    }

    // 3. Network & Infrastructure Issues (ECONNREFUSED / 502 / 503 / 504 / DNS)
    if (err.includes('econnrefused') || err.includes('enotfound') || err.includes('502') || err.includes('503') || err.includes('504') || err.includes('fetch failed')) {
      return {
        category: FindingCategory.NETWORK_ISSUE,
        severity: FindingSeverity.CRITICAL,
        title: 'Network Connection Refused or Gateway Unreachable',
        rootCauseAnalysis: `Target host could not be reached over network. Error: ${errorMessage}`,
        suggestedFix: 'Verify the target service is running, ports are open, and DNS resolves correctly.',
        suggestedPatch: null,
        autoHealSelector: null,
        confidence: 0.94,
        affectedFiles: ['apps/api/src/server.ts'],
        affectedCode: ['app.listen(...)'],
        regressionRisk: 'HIGH'
      };
    }

    // 4. Selector Drift (Element Locator Broken / Timeout waiting for selector)
    if (err.includes('waiting for selector') || err.includes('locator not found') || (err.includes('selector') && err.includes('timeout'))) {
      const failedTarget = evidence?.failedStep?.target || 'target-selector';
      const cleanTarget = failedTarget.replace(/[^a-zA-Z0-9_-]/g, '');
      const healedSelector = `[data-testid="${cleanTarget || 'action-btn'}"]`;

      return {
        category: FindingCategory.SELECTOR_DRIFT,
        severity: FindingSeverity.MEDIUM,
        title: `Selector Drift: Locator '${failedTarget}' Not Found`,
        rootCauseAnalysis: `The DOM structure changed or the selector '${failedTarget}' was renamed/removed in the rendered page.`,
        suggestedFix: `Update test step to use resilient semantic locator: ${healedSelector}`,
        suggestedPatch: `--- a/test.spec.ts\n+++ b/test.spec.ts\n- await page.click('${failedTarget}');\n+ await page.click('${healedSelector}');`,
        autoHealSelector: healedSelector,
        confidence: 0.92,
        affectedFiles: ['packages/browser/src/playwright-engine.ts'],
        affectedCode: [`page.click('${failedTarget}')`],
        regressionRisk: 'LOW'
      };
    }

    // 5. Timing Issues (Wait condition / async delay / render race condition)
    if (err.includes('exceeded 5000ms') || err.includes('navigation timeout') || (err.includes('timeout') && !err.includes('selector'))) {
      return {
        category: FindingCategory.TIMING_ISSUE,
        severity: FindingSeverity.MEDIUM,
        title: 'Asynchronous Render Timeout / Timing Race Condition',
        rootCauseAnalysis: `Operation exceeded allotted time before the browser reached the required state. Error: ${errorMessage}`,
        suggestedFix: 'Replace fixed sleeps with explicit event/selector waits or adjust step timeout threshold.',
        suggestedPatch: null,
        autoHealSelector: null,
        confidence: 0.90,
        affectedFiles: ['packages/browser/src/playwright-engine.ts'],
        affectedCode: ['await page.waitForLoadState("domcontentloaded")'],
        regressionRisk: 'LOW'
      };
    }

    // 6. Data Validation / Schema Issues
    if (err.includes('validation error') || err.includes('zoderror') || err.includes('null value in column') || err.includes('foreign key constraint')) {
      return {
        category: FindingCategory.DATA_ISSUE,
        severity: FindingSeverity.HIGH,
        title: 'Database Constraint or Input Validation Schema Mismatch',
        rootCauseAnalysis: `Payload or database entity violated schema constraints: ${errorMessage}`,
        suggestedFix: 'Verify pre-condition database seeding and validate required input attributes.',
        suggestedPatch: null,
        autoHealSelector: null,
        confidence: 0.91,
        affectedFiles: ['packages/types/src/index.ts'],
        affectedCode: ['Schema.parse(...)'],
        regressionRisk: 'MEDIUM'
      };
    }

    // 7. Real Bug (500 internal server error / Unhandled Exception / Assertion Mismatch)
    if (err.includes('500') || err.includes('internal server error') || err.includes('nullreference') || err.includes('typeerror') || err.includes('assertion failed') || stack.includes('error:')) {
      return {
        category: FindingCategory.REAL_BUG,
        severity: FindingSeverity.HIGH,
        title: 'Application Runtime Defect / Uncaught Exception',
        rootCauseAnalysis: `Application threw an uncaught runtime error during test execution: ${errorMessage}`,
        suggestedFix: 'Inspect application stack trace to fix null pointer or unhandled promise rejection.',
        suggestedPatch: null,
        autoHealSelector: null,
        confidence: 0.93,
        affectedFiles: ['apps/api/src/server.ts'],
        affectedCode: [errorMessage.slice(0, 100)],
        regressionRisk: 'HIGH'
      };
    }

    return null;
  }

  /**
   * Deterministic fallback when LLM output is unavailable
   */
  private fallbackAnalysis(input: AIFailureTriageInput, evidence: FailureEvidence) {
    const isFlaky = (evidence.historicalFlakinessScore || 0) > 0.3;
    return {
      category: isFlaky ? FindingCategory.TEST_FLAKINESS : FindingCategory.UNKNOWN,
      severity: FindingSeverity.HIGH,
      title: isFlaky ? 'Intermittent Test Flakiness Detected' : 'Unclassified Execution Failure',
      rootCauseAnalysis: input.errorMessage || 'Failure occurred during test step execution.',
      suggestedFix: 'Review execution telemetry, screenshots, and logs.',
      suggestedPatch: null,
      autoHealSelector: null,
      confidence: 0.75,
      affectedFiles: [],
      affectedCode: [],
      regressionRisk: 'MEDIUM'
    };
  }

  /**
   * Guardrail Engine: Determines if a failure is safely eligible for automatic self-healing.
   * NEVER hides genuine application defects!
   */
  determineSelfHealEligibility(
    category: FindingCategory,
    evidence: FailureEvidence,
    healedSelector?: string | null
  ): { isSelfHealEligible: boolean; selfHealType?: SelfHealType } {
    // ❌ STRICT PROHIBITION: Never auto-heal genuine bugs or security/environment issues
    const disallowList: FindingCategory[] = [
      FindingCategory.REAL_BUG,
      FindingCategory.DATA_ISSUE,
      FindingCategory.AUTHENTICATION_ISSUE,
      FindingCategory.PERMISSION_ISSUE,
      FindingCategory.ENVIRONMENT_ISSUE,
      FindingCategory.NETWORK_ISSUE,
      FindingCategory.UNKNOWN
    ];

    if (disallowList.includes(category)) {
      return { isSelfHealEligible: false };
    }

    // ✅ Allowed: Selector drift with clear replacement locator
    if (category === FindingCategory.SELECTOR_DRIFT) {
      if (healedSelector || evidence.domSnapshotSnippet) {
        return { isSelfHealEligible: true, selfHealType: 'SELECTOR_UPDATE' };
      }
    }

    // ✅ Allowed: Timing issue where wait strategy can be safely updated
    if (category === FindingCategory.TIMING_ISSUE) {
      return { isSelfHealEligible: true, selfHealType: 'WAIT_STRATEGY' };
    }

    // ✅ Allowed: High flakiness where retry policy needs tuning
    if (category === FindingCategory.TEST_FLAKINESS) {
      if ((evidence.historicalFlakinessScore || 0) > 0.2) {
        return { isSelfHealEligible: true, selfHealType: 'RETRY_TUNING' };
      }
    }

    return { isSelfHealEligible: false };
  }
}
