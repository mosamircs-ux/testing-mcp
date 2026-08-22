import { describe, it, expect } from 'vitest';
import { ProjectAnalyzer } from './project-analyzer.js';
import { TestGenerator } from './test-generator.js';
import { FailureAnalyzer } from './failure-analyzer.js';
import { AutoHealer } from './auto-healer.js';
import { ProjectCategory, FindingCategory } from '@novaqa/types';

describe('AI Package Pipelines', () => {
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

  it('FailureAnalyzer should triage failures into Bug vs Flake with root cause', async () => {
    const analyzer = new FailureAnalyzer();
    const result = await analyzer.analyzeFailure({
      testResultId: 'res-fail-1',
      errorMessage: 'Unhandled 500 NullReference in Checkout Payment Hook',
      stackTrace: 'Error: Cannot read property postalCode of undefined'
    });

    expect(result.category).toBeDefined();
    expect(result.severity).toBeDefined();
    expect(result.rootCauseAnalysis).toBeDefined();
  });

  it('AutoHealer should formulate replacement selectors from DOM', async () => {
    const healer = new AutoHealer();
    const result = await healer.healSelector({
      testCaseId: 'case-123',
      failedStepOrder: 2,
      failedSelector: 'button#old-submit-btn',
      currentDomSnapshot: '<form><button data-testid="checkout-submit">Pay Now</button></form>',
      errorMessage: 'Timeout waiting for button#old-submit-btn'
    });

    expect(result.healed).toBe(true);
    expect(result.recommendedSelector).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0.5);
  });
});
