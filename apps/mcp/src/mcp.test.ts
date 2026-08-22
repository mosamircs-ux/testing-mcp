import { describe, it, expect } from 'vitest';
import { prisma } from '@novaqa/database';
import { orchestrator } from '@novaqa/test-runner';
import {
  handleListProjects,
  handleAnalyzeProject,
  handleGenerateTestPlan,
  handleGenerateTestCode,
  handleExecuteTestRun,
  handleGetTestRunStatus,
  handleAnalyzeFailures,
  handleAutoHealTest
} from './tools';

describe('NovaQA Monorepo MCP Server & Tool Verification', () => {
  it('should list projects and test suites via MCP tool', async () => {
    const response = await handleListProjects();
    expect(response.content.length).toBeGreaterThan(0);
    const text = response.content[0].text;
    expect(text).toContain('E-Commerce Storefront');
    expect(text).toContain('Order & Payment Gateway API');
  });

  it('should analyze project requirements and discover flows via MCP', async () => {
    const project = await prisma.project.findFirst();
    expect(project).toBeDefined();

    const response = await handleAnalyzeProject({
      projectId: project!.id,
      targetUrl: 'http://localhost:3000'
    });

    expect(response.content[0].text).toContain('flows');
  });

  it('should generate test plan and scenarios via MCP', async () => {
    const project = await prisma.project.findFirst();
    expect(project).toBeDefined();

    const response = await handleGenerateTestPlan({
      projectId: project!.id,
      featureDescription: 'User adds classic t-shirt to shopping cart'
    });

    expect(response.content[0].text).toContain('testCases');
  });

  it('should generate executable Playwright code via MCP', async () => {
    const response = await handleGenerateTestCode({
      testCaseTitle: 'Should checkout with credit card',
      targetUrl: 'http://localhost:3000/checkout',
      actions: ['Click checkout button', 'Enter card details']
    });

    expect(response.content[0].text).toContain('@playwright/test');
    expect(response.content[0].text).toContain('page.goto');
  });

  it('should execute end-to-end test run in sandbox and generate report', async () => {
    const project = await prisma.project.findFirst({
      include: { environments: true, testSuites: true }
    });
    expect(project).toBeDefined();

    const response = await handleExecuteTestRun({
      projectId: project!.id,
      suiteId: project!.testSuites[0]?.id,
      environmentId: project!.environments[0]?.id
    });

    expect(response.content[0].text).toContain('Test Run #');
    expect(response.content[0].text).toContain('NovaQA Test Run Summary');
  });

  it('should triage failures and auto-heal brittle selectors via MCP', async () => {
    const testCase = await prisma.testCase.findFirst();
    expect(testCase).toBeDefined();

    const healResponse = await handleAutoHealTest({
      testCaseId: testCase!.id,
      failedSelector: 'button#old-checkout-btn',
      currentDomSnapshot: '<form><button data-testid="checkout-submit">Submit</button></form>'
    });

    expect(healResponse.content[0].text).toContain('healed');
  });
});
