import { AIClient, aiClient } from './client';
import { AIFailureTriageInput, FindingCategory, FindingSeverity } from '@novaqa/types';

export interface FailureTriageResult {
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  rootCauseAnalysis: string;
  suggestedFix: string;
  suggestedPatch?: string | null;
  autoHealSelector?: string | null;
}

export class FailureAnalyzer {
  constructor(private client: AIClient = aiClient) {}

  async analyzeFailure(input: AIFailureTriageInput): Promise<FailureTriageResult> {
    const systemPrompt = `You are a Principal Software Reliability and QA Triaging AI. Analyze test failure logs, stack traces, DOM snapshots, and network calls. Determine the exact root cause. Classify the issue into one of: 'BUG' (application issue), 'FLAKY_TEST' (timing/brittle locator), 'REGRESSION', 'SPEC_DRIFT', 'PERFORMANCE', or 'SECURITY'. Provide actionable fixes, a git diff patch if code fix is identified, or an autoHealSelector if DOM selector changed. Return valid JSON adhering to: { "category": string, "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW", "title": string, "rootCauseAnalysis": string, "suggestedFix": string, "suggestedPatch": string|null, "autoHealSelector": string|null }`;

    const userPrompt = `action: analyze_failure\nErrorMessage: ${input.errorMessage}\nStackTrace: ${input.stackTrace || ''}\nStepLogs: ${(input.stepLogs || []).join('\n')}\nDOM: ${input.domSnapshot ? input.domSnapshot.slice(0, 1000) : ''}`;

    const response = await this.client.generate<FailureTriageResult>({
      systemPrompt,
      userPrompt,
      responseFormat: 'json',
      temperature: 0.1
    });

    if (!response.parsed) {
      const isSelector = input.errorMessage.toLowerCase().includes('selector') || input.errorMessage.toLowerCase().includes('locator');
      return {
        category: isSelector ? FindingCategory.FLAKY_TEST : FindingCategory.BUG,
        severity: FindingSeverity.HIGH,
        title: isSelector ? 'Selector Timeout / Brittle Element Locator' : 'Application Runtime Error',
        rootCauseAnalysis: input.errorMessage,
        suggestedFix: isSelector
          ? 'Use data-testid or role-based locators instead of dynamic CSS paths.'
          : 'Inspect server logs for 500 error or null reference in handling request.',
        suggestedPatch: null,
        autoHealSelector: isSelector ? '[data-testid="primary-action-button"]' : null
      };
    }

    return response.parsed;
  }
}
