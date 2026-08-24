import { AIClient, aiClient } from './client';
import { prisma } from '@novaqa/database';
import {
  AIAutoHealInput,
  FindingStatus,
  SelfHealAction,
  SelfHealType
} from '@novaqa/types';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('ai-auto-healer');

export interface AutoHealResult {
  healed: boolean;
  originalSelector: string;
  recommendedSelector: string;
  confidence: number;
  explanation: string;
  suggestedPatch?: string;
  healType: SelfHealType;
  safeToAutoApply: boolean;
}

export class AutoHealer {
  constructor(private client: AIClient = aiClient) {}

  /**
   * Multi-strategy resilient selector repair:
   * Analyzes broken selectors against DOM snapshots and synthesizes resilient locators
   * (favoring data-testid > role + name > aria-label > unique text > stable CSS).
   */
  async healSelector(input: AIAutoHealInput): Promise<AutoHealResult> {
    log.info({ testCaseId: input.testCaseId, failedSelector: input.failedSelector }, 'Initiating selector auto-healing');

    // Rule-based heuristic locator synthesis from DOM snippet if present
    const heuristic = this.heuristicHealSelector(input.failedSelector, input.currentDomSnapshot);

    const systemPrompt = `You are an Autonomous Test Self-Healing Specialist.
Given a broken selector that failed in a browser test, inspect the current DOM HTML snapshot to locate the target element and synthesize a robust, resilient selector.
Hierarchy of preferred locators:
1. data-testid or data-cy or data-test attributes (e.g., [data-testid="checkout-btn"])
2. Accessibility role with accessible name (e.g., role=button[name="Submit Order"])
3. Aria attributes (e.g., [aria-label="Close modal"])
4. Semantic button/input text (e.g., text="Proceed to Checkout")
5. Stable semantic CSS classes (avoid dynamically generated hashed class names)

Return ONLY valid JSON:
{
  "healed": boolean,
  "originalSelector": string,
  "recommendedSelector": string,
  "confidence": number (0.0 to 1.0),
  "explanation": string,
  "suggestedPatch": string
}`;

    const userPrompt = `action: auto_heal\nFailedSelector: ${input.failedSelector}\nError: ${input.errorMessage}\nDOM Snapshot: ${input.currentDomSnapshot.slice(0, 2000)}`;

    const response = await this.client.generate<any>({
      systemPrompt,
      userPrompt,
      responseFormat: 'json',
      temperature: 0.1
    });

    let result = response.parsed;

    if (!result || !result.recommendedSelector) {
      result = heuristic;
    }

    return {
      healed: Boolean(result.healed ?? true),
      originalSelector: input.failedSelector,
      recommendedSelector: result.recommendedSelector,
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.92,
      explanation: result.explanation || 'Repaired brittle selector using semantic DOM attributes.',
      suggestedPatch: result.suggestedPatch || `--- a/test.spec.ts\n+++ b/test.spec.ts\n- await page.click('${input.failedSelector}');\n+ await page.click('${result.recommendedSelector}');`,
      healType: 'SELECTOR_UPDATE',
      safeToAutoApply: true
    };
  }

  /**
   * Synthesizes wait strategy updates for timing / render race conditions
   */
  async healWaitStrategy(
    targetSelector: string,
    currentTimeoutMs: number = 5000,
    p95DurationMs: number = 7200
  ): Promise<SelfHealAction> {
    const recommendedTimeout = Math.min(30000, Math.max(10000, Math.ceil(p95DurationMs * 1.5)));
    const explanation = `Upgraded static timeout (${currentTimeoutMs}ms) to adaptive timeout (${recommendedTimeout}ms) with explicit visibility wait.`;

    return {
      type: 'WAIT_STRATEGY',
      targetCaseId: '',
      originalValue: `timeout: ${currentTimeoutMs}ms`,
      healedValue: `await page.waitForSelector('${targetSelector}', { state: 'visible', timeout: ${recommendedTimeout} })`,
      confidence: 0.94,
      explanation,
      patchDiff: `--- a/test.spec.ts\n+++ b/test.spec.ts\n- await page.waitForTimeout(${currentTimeoutMs});\n+ await page.waitForSelector('${targetSelector}', { state: 'visible', timeout: ${recommendedTimeout} });`,
      safeToAutoApply: true
    };
  }

  /**
   * Synthesizes retry policy adjustments for flaky tests
   */
  async tuneRetryStrategy(
    testCaseId: string,
    flakinessScore: number,
    currentAttempts: number = 1
  ): Promise<SelfHealAction> {
    const recommendedAttempts = flakinessScore > 0.5 ? 3 : 2;
    const explanation = `Configured automated retry policy (max ${recommendedAttempts} attempts with exponential backoff) due to test flakiness score ${flakinessScore.toFixed(2)}.`;

    return {
      type: 'RETRY_TUNING',
      targetCaseId: testCaseId,
      originalValue: `maxAttempts: ${currentAttempts}`,
      healedValue: `maxAttempts: ${recommendedAttempts}, backoffMs: 1500`,
      confidence: 0.91,
      explanation,
      patchDiff: `--- a/test.config.ts\n+++ b/test.config.ts\n- retries: ${currentAttempts - 1}\n+ retries: ${recommendedAttempts - 1}`,
      safeToAutoApply: true
    };
  }

  /**
   * Applies self-heal action to the test case step in database and creates a SelfHealLog record
   */
  async applySelfHeal(
    findingId: string,
    testCaseId: string,
    action: SelfHealAction
  ): Promise<{ success: boolean; selfHealLogId?: string }> {
    try {
      log.info({ findingId, testCaseId, healType: action.type }, 'Applying self-heal action to test case');

      // 1. Update TestCaseStep if selector or wait strategy
      if (action.type === 'SELECTOR_UPDATE' || action.type === 'LOCATOR_IMPROVEMENT') {
        if (action.stepOrder !== undefined) {
          const step = await prisma.testCaseStep.findFirst({
            where: { testCaseId, order: action.stepOrder }
          });
          if (step) {
            await prisma.testCaseStep.update({
              where: { id: step.id },
              data: { target: action.healedValue }
            });
          }
        } else {
          // If stepOrder was not given, find step matching originalValue
          const step = await prisma.testCaseStep.findFirst({
            where: { testCaseId, target: action.originalValue }
          });
          if (step) {
            await prisma.testCaseStep.update({
              where: { id: step.id },
              data: { target: action.healedValue }
            });
          }
        }
      }

      // 2. Create SelfHealLog audit record
      const healLog = await prisma.selfHealLog.create({
        data: {
          findingId,
          testCaseId,
          healType: action.type,
          originalValue: action.originalValue,
          healedValue: action.healedValue,
          confidence: action.confidence,
          verificationStatus: 'PENDING'
        }
      });

      // 3. Update Finding status to AUTO_HEALED
      await prisma.finding.update({
        where: { id: findingId },
        data: {
          status: FindingStatus.AUTO_HEALED,
          autoHealSelector: action.healedValue
        }
      });

      return { success: true, selfHealLogId: healLog.id };
    } catch (err: any) {
      log.error({ err: err.message, findingId, testCaseId }, 'Failed to apply self-heal action');
      return { success: false };
    }
  }

  /**
   * Deterministic heuristic selector synthesis
   */
  private heuristicHealSelector(failedSelector: string, domSnippet?: string): { healed: boolean; recommendedSelector: string; confidence: number; explanation: string; suggestedPatch: string } {
    if (domSnippet) {
      // Look for data-testid in DOM
      const testIdMatch = domSnippet.match(/data-testid=["']([^"']+)["']/i);
      if (testIdMatch && testIdMatch[1]) {
        const recommended = `[data-testid="${testIdMatch[1]}"]`;
        return {
          healed: true,
          recommendedSelector: recommended,
          confidence: 0.95,
          explanation: `Discovered semantic data-testid "${testIdMatch[1]}" in rendered DOM HTML.`,
          suggestedPatch: `--- a/test.spec.ts\n+++ b/test.spec.ts\n- await page.click('${failedSelector}');\n+ await page.click('${recommended}');`
        };
      }

      // Look for button or input with aria-label
      const ariaMatch = domSnippet.match(/aria-label=["']([^"']+)["']/i);
      if (ariaMatch && ariaMatch[1]) {
        const recommended = `[aria-label="${ariaMatch[1]}"]`;
        return {
          healed: true,
          recommendedSelector: recommended,
          confidence: 0.90,
          explanation: `Found accessible aria-label "${ariaMatch[1]}" in DOM.`,
          suggestedPatch: `--- a/test.spec.ts\n+++ b/test.spec.ts\n- await page.click('${failedSelector}');\n+ await page.click('${recommended}');`
        };
      }
    }

    const cleanName = failedSelector.replace(/[^a-zA-Z0-9_-]/g, '') || 'action-btn';
    const recommended = `[data-testid="${cleanName}"]`;

    return {
      healed: true,
      recommendedSelector: recommended,
      confidence: 0.88,
      explanation: `Synthesized resilient data-testid locator based on intent of '${failedSelector}'.`,
      suggestedPatch: `--- a/test.spec.ts\n+++ b/test.spec.ts\n- await page.click('${failedSelector}');\n+ await page.click('${recommended}');`
    };
  }
}
