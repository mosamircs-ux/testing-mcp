import { describe, it, expect } from 'vitest';
import { ProjectAnalyzer } from './project-analyzer.js';
import { TestGenerator } from './test-generator.js';
import { FailureAnalyzer } from './failure-analyzer.js';
import { AutoHealer } from './auto-healer.js';
import { fixProposalEngine } from './fix-proposal-engine.js';
import { verificationEngine } from './verification-engine.js';
import { ProjectCategory, FindingCategory, FindingSeverity, FindingStatus } from '@novaqa/types';
import { prisma } from '@novaqa/database';

describe('AI Package Pipelines & Failure Analysis Engine', () => {
  it('ProjectAnalyzer should discover flows and recommended suites', async () => {
    const analyzer = new ProjectAnalyzer();
    const result = await analyzer.analyze({
      projectId: 'prj-test-1',
      projectCategory: ProjectCategory.ECOMMERCE,
      targetUrl: 'http://localhost:3000'
    });

    expect(result.summary).toBeDefined();
    expect(result.flows.length).toBeGreaterThan(0);
    expect(result.recommendedSuites.length).toBeGreaterThan(0);
  });

  it('TestGenerator should generate structured executable test cases', async () => {
    const generator = new TestGenerator();
    const result = await generator.generateTests({
      projectId: 'prj-test-1',
      featureDescription: 'User adds item to shopping cart and validates subtotal',
      categories: ['functional']
    });

    expect(result.testCases.length).toBeGreaterThan(0);
    const firstCase = result.testCases[0];
    expect(firstCase.title).toBeDefined();
    expect(firstCase.steps.length).toBeGreaterThan(0);
  });

  describe('FailureAnalyzer 10-Class Failure Classification & Evidence Analysis', () => {
    const analyzer = new FailureAnalyzer();

    it('should classify REAL_BUG for 500 null reference in application code', async () => {
      const result = await analyzer.analyzeFailure({
        testResultId: 'res-fail-real-bug',
        errorMessage: '500 Internal Server Error: TypeError: Cannot read properties of null (reading "shippingAddress")',
        stackTrace: 'at OrderService.processCheckout (src/services/order.ts:42:15)'
      });

      expect(result.category).toBe(FindingCategory.REAL_BUG);
      expect(result.severity).toBe(FindingSeverity.HIGH);
      expect(result.isSelfHealEligible).toBe(false); // REAL_BUG MUST NOT be auto-healed
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.rootCauseAnalysis).toBeDefined();
    });

    it('should classify SELECTOR_DRIFT for locator timeout and propose resilient selector', async () => {
      const result = await analyzer.analyzeFailure({
        testResultId: 'res-fail-selector',
        errorMessage: 'Timeout 5000ms exceeded waiting for selector "button#submit-order-legacy"',
        domSnapshot: '<form><button data-testid="submit-order" class="btn-primary">Place Order</button></form>',
        failedStepDetails: { order: 3, action: 'CLICK', target: 'button#submit-order-legacy' }
      });

      expect(result.category).toBe(FindingCategory.SELECTOR_DRIFT);
      expect(result.isSelfHealEligible).toBe(true);
      expect(result.selfHealType).toBe('SELECTOR_UPDATE');
      expect(result.autoHealSelector).toBeDefined();
      expect(result.suggestedPatch).toBeDefined();
    });

    it('should classify TIMING_ISSUE for asynchronous timeout race condition', async () => {
      const result = await analyzer.analyzeFailure({
        testResultId: 'res-fail-timing',
        errorMessage: 'Navigation timeout exceeded 5000ms before domcontentloaded',
        stackTrace: 'at page.waitForLoadState (node_modules/playwright/lib/page.js:120)'
      });

      expect(result.category).toBe(FindingCategory.TIMING_ISSUE);
      expect(result.isSelfHealEligible).toBe(true);
      expect(result.selfHealType).toBe('WAIT_STRATEGY');
    });

    it('should classify PERMISSION_ISSUE for HTTP 403 Forbidden', async () => {
      const result = await analyzer.analyzeFailure({
        testResultId: 'res-fail-rbac',
        errorMessage: 'ForbiddenError: Role "VIEWER" lacks "project.create" permission (403 Forbidden)',
        stackTrace: 'at requirePermission (apps/api/src/middleware/auth.ts:142)'
      });

      expect(result.category).toBe(FindingCategory.PERMISSION_ISSUE);
      expect(result.isSelfHealEligible).toBe(false);
    });

    it('should classify AUTHENTICATION_ISSUE for HTTP 401 Unauthorized', async () => {
      const result = await analyzer.analyzeFailure({
        testResultId: 'res-fail-auth',
        errorMessage: 'Unauthorized: JWT expired or invalid token (HTTP 401)',
        stackTrace: 'at TokenService.verifyAccessToken (packages/auth/src/token.ts:50)'
      });

      expect(result.category).toBe(FindingCategory.AUTHENTICATION_ISSUE);
      expect(result.isSelfHealEligible).toBe(false);
    });

    it('should classify NETWORK_ISSUE for ECONNREFUSED', async () => {
      const result = await analyzer.analyzeFailure({
        testResultId: 'res-fail-net',
        errorMessage: 'fetch failed: connect ECONNREFUSED 127.0.0.1:4000',
        stackTrace: 'at TCPConnectWrap.afterConnect (node:net:1600)'
      });

      expect(result.category).toBe(FindingCategory.NETWORK_ISSUE);
      expect(result.isSelfHealEligible).toBe(false);
    });

    it('should classify DATA_ISSUE for schema validation errors', async () => {
      const result = await analyzer.analyzeFailure({
        testResultId: 'res-fail-data',
        errorMessage: 'ZodError: validation error: Required string field "email" received null',
        stackTrace: 'at ZodObject.parse (node_modules/zod/lib/index.js:52)'
      });

      expect(result.category).toBe(FindingCategory.DATA_ISSUE);
      expect(result.isSelfHealEligible).toBe(false);
    });
  });

  describe('AutoHealer Engine & Wait/Retry Strategies', () => {
    const healer = new AutoHealer();

    it('should heal broken selector into semantic data-testid locator', async () => {
      const result = await healer.healSelector({
        testCaseId: 'case-123',
        failedStepOrder: 2,
        failedSelector: 'button#old-submit-btn',
        currentDomSnapshot: '<form><button data-testid="checkout-submit">Pay Now</button></form>',
        errorMessage: 'Timeout waiting for button#old-submit-btn'
      });

      expect(result.healed).toBe(true);
      expect(result.recommendedSelector).toBe('[data-testid="checkout-submit"]');
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.safeToAutoApply).toBe(true);
    });

    it('should formulate adaptive wait strategy for timing issues', async () => {
      const action = await healer.healWaitStrategy('div.loading-spinner', 3000, 6500);
      expect(action.type).toBe('WAIT_STRATEGY');
      expect(action.healedValue).toContain('waitForSelector');
      expect(action.safeToAutoApply).toBe(true);
    });

    it('should tune retry policy for flaky tests', async () => {
      const action = await healer.tuneRetryStrategy('case-flaky', 0.65, 1);
      expect(action.type).toBe('RETRY_TUNING');
      expect(action.healedValue).toContain('maxAttempts: 3');
    });
  });

  describe('Fix Proposal, Approval Gate & History Lifecycle', () => {
    let testFindingId: string;

    it('should generate fix proposal and patch diff requiring approval for REAL_BUG', async () => {
      // Create seed test run and finding
      const project = await prisma.project.findFirst({ include: { testSuites: { include: { testCases: true } }, environments: true } });
      expect(project).toBeDefined();

      const run = await prisma.testRun.create({
        data: {
          projectId: project!.id,
          environmentId: project!.environments[0]!.id,
          suiteId: project!.testSuites[0]!.id,
          status: 'FAILED',
          totalTests: 1,
          failedTests: 1
        }
      });

      const res = await prisma.testResult.create({
        data: {
          testRunId: run.id,
          testCaseId: project!.testSuites[0]!.testCases[0]!.id,
          status: 'FAILED',
          errorMessage: 'NullReferenceException on cart subtotal calculation'
        }
      });

      const finding = await prisma.finding.create({
        data: {
          testRunId: run.id,
          testResultId: res.id,
          projectId: project!.id,
          category: FindingCategory.REAL_BUG,
          severity: FindingSeverity.HIGH,
          status: FindingStatus.OPEN,
          title: 'NullReferenceException in Cart Subtotal Calculation',
          description: 'Cart subtotal thrown when coupon is undefined',
          rootCauseAnalysis: 'Unchecked coupon discount calculation in cart helper'
        }
      });

      testFindingId = finding.id;

      const proposal = await fixProposalEngine.generateFixProposal(testFindingId);
      expect(proposal).toBeDefined();
      expect(proposal!.requiresExplicitApproval).toBe(true); // Must require explicit approval
      expect(proposal!.patchDiff).toBeDefined();

      const updated = await prisma.finding.findUnique({ where: { id: testFindingId } });
      expect(updated!.status).toBe(FindingStatus.FIX_PROPOSED);
    });

    it('should record fix approval in history and update status to FIX_APPROVED', async () => {
      const approval = await fixProposalEngine.approveFix(testFindingId, {
        actor: 'lead-dev@acme.com',
        notes: 'Verified logic and approved patch for verification run'
      });

      expect(approval.success).toBe(true);
      expect(approval.finding?.status).toBe(FindingStatus.FIX_APPROVED);
      expect(approval.finding?.fixApproved).toBe(true);

      const history = await fixProposalEngine.getFixHistory(testFindingId);
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history.some((h) => h.action === 'APPROVED')).toBe(true);
    });

    it('should execute verification lifecycle and resolve finding only after verification succeeds', async () => {
      const verification = await verificationEngine.verifyFix(testFindingId, {
        scope: 'FULL_REGRESSION'
      });

      expect(verification.verified).toBe(true);
      expect(verification.finalFindingStatus).toBe(FindingStatus.RESOLVED);
      expect(verification.stages.length).toBe(3); // Stage 1, Stage 2, Stage 3

      const resolved = await prisma.finding.findUnique({ where: { id: testFindingId } });
      expect(resolved!.status).toBe(FindingStatus.RESOLVED);
    });
  });
});
