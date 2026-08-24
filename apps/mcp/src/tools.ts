import { prisma } from '@novaqa/database';
import { ProjectAnalyzer, TestGenerator, FailureAnalyzer, AutoHealer } from '@novaqa/ai';
import { orchestrator } from '@novaqa/test-runner';
import { workerQueue } from '@novaqa/worker';
import { MarkdownReporter } from '@novaqa/reporting';
import { TestRunStatus, FindingCategory, FindingSeverity, FindingStatus } from '@novaqa/types';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('mcp-tools');

const projectAnalyzer = new ProjectAnalyzer();
const testGenerator = new TestGenerator();
const failureAnalyzer = new FailureAnalyzer();
const autoHealer = new AutoHealer();

export async function handleListProjects(context?: { organizationId?: string; projectId?: string }) {
  const whereClause: any = {};
  if (context?.organizationId) whereClause.organizationId = context.organizationId;
  if (context?.projectId) whereClause.id = context.projectId;

  const projects = await prisma.project.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    include: {
      environments: true,
      testSuites: {
        include: {
          testCases: { select: { id: true, title: true, priority: true, category: true } }
        }
      }
    }
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          projects.map((p) => ({
            id: p.id,
            organizationId: p.organizationId,
            name: p.name,
            slug: p.slug,
            category: p.category,
            engineType: p.engineType,
            environments: p.environments.map((e) => ({ id: e.id, name: e.name, baseUrl: e.baseUrl })),
            suites: p.testSuites.map((s) => ({ id: s.id, name: s.name, totalCases: s.testCases.length }))
          })),
          null,
          2
        )
      }
    ]
  };
}

export async function handleAnalyzeProject(args: { projectId: string; repositoryContext?: string; specContent?: string; targetUrl?: string }) {
  const project = await prisma.project.findUnique({ where: { id: args.projectId } });
  if (!project) throw new Error(`Project ${args.projectId} not found`);

  const result = await projectAnalyzer.analyze({
    projectId: project.id,
    projectCategory: project.category as any,
    targetUrl: args.targetUrl || project.baseUrl || undefined,
    repositoryContext: args.repositoryContext,
    specContent: args.specContent
  });

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
}

export async function handleGenerateTestPlan(args: { projectId: string; featureDescription: string; targetUrl?: string }) {
  const project = await prisma.project.findUnique({ where: { id: args.projectId } });
  if (!project) throw new Error(`Project ${args.projectId} not found`);

  const result = await testGenerator.generateTests({
    projectId: project.id,
    featureDescription: args.featureDescription,
    targetUrl: args.targetUrl || project.baseUrl || undefined,
    categories: ['functional', 'edge-case', 'security', 'regression']
  });

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
}

export async function handleGenerateTestCode(args: { testCaseTitle: string; targetUrl: string; actions: string[] }) {
  const code = `import { test, expect } from '@playwright/test';

test('${args.testCaseTitle}', async ({ page }) => {
  // 1. Navigate to target
  await page.goto('${args.targetUrl}');

  // 2. Perform actions
  ${args.actions.map((act) => `// Action: ${act}`).join('\n  ')}

  // 3. Final assertion
  await expect(page).toHaveTitle(/.*App.*/);
});`;

  return {
    content: [{ type: 'text', text: code }]
  };
}

export async function handleExecuteTestRun(args: { projectId: string; suiteId?: string; environmentId?: string }) {
  const project = await prisma.project.findUnique({
    where: { id: args.projectId },
    include: { environments: true, testSuites: { include: { testCases: true } } }
  });

  if (!project) throw new Error(`Project ${args.projectId} not found`);

  const targetEnv = args.environmentId
    ? project.environments.find((e) => e.id === args.environmentId)
    : project.environments[0];

  const targetSuite = args.suiteId
    ? project.testSuites.find((s) => s.id === args.suiteId)
    : project.testSuites[0];

  if (!targetEnv) throw new Error('No valid environment found for this project');

  const run = await prisma.testRun.create({
    data: {
      projectId: project.id,
      suiteId: targetSuite?.id,
      environmentId: targetEnv.id,
      triggerSource: 'MCP_AGENT',
      status: TestRunStatus.QUEUED,
      totalTests: targetSuite ? targetSuite.testCases.length : 0
    }
  });

  // Trigger test runner execution synchronously or via worker queue
  await orchestrator.executeRun(run.id);

  const completedRun = await prisma.testRun.findUnique({
    where: { id: run.id },
    include: {
      results: { include: { testCase: true } },
      findings: true
    }
  });

  const report = MarkdownReporter.generate({
    run: completedRun as any,
    results: (completedRun?.results || []).map((r) => ({ ...r, testCaseTitle: r.testCase.title })) as any,
    findings: completedRun?.findings as any
  });

  return {
    content: [
      {
        type: 'text',
        text: `🚀 Test Run #${run.id} Completed!\n\n${report}`
      }
    ]
  };
}

export async function handleGetTestRunStatus(args: { runId: string }) {
  const run = await prisma.testRun.findUnique({
    where: { id: args.runId },
    include: {
      project: true,
      results: { include: { testCase: true } },
      findings: true,
      artifacts: true
    }
  });

  if (!run) throw new Error(`TestRun ${args.runId} not found`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            id: run.id,
            status: run.status,
            totalTests: run.totalTests,
            passedTests: run.passedTests,
            failedTests: run.failedTests,
            durationMs: run.durationMs,
            findingsCount: run.findings.length,
            artifactsCount: run.artifacts.length,
            results: run.results.map((r) => ({
              caseTitle: r.testCase.title,
              status: r.status,
              durationMs: r.durationMs,
              errorMessage: r.errorMessage
            }))
          },
          null,
          2
        )
      }
    ]
  };
}

export async function handleAnalyzeFailures(args: { runId: string }) {
  const run = await prisma.testRun.findUnique({
    where: { id: args.runId },
    include: {
      findings: true,
      results: {
        where: { status: 'FAILED' },
        include: { testCase: true }
      }
    }
  });

  if (!run) throw new Error(`TestRun ${args.runId} not found`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            runId: run.id,
            failedTestsCount: run.results.length,
            findings: run.findings.map((f) => ({
              id: f.id,
              category: f.category,
              severity: f.severity,
              status: f.status,
              title: f.title,
              rootCause: f.rootCauseAnalysis,
              confidence: f.confidence,
              regressionRisk: f.regressionRisk,
              suggestedFix: f.suggestedFix,
              suggestedPatch: f.suggestedPatch,
              autoHealSelector: f.autoHealSelector,
              affectedFiles: f.affectedFiles ? (typeof f.affectedFiles === 'string' ? JSON.parse(f.affectedFiles) : f.affectedFiles) : [],
              fixHistory: f.fixHistory ? (typeof f.fixHistory === 'string' ? JSON.parse(f.fixHistory) : f.fixHistory) : []
            }))
          },
          null,
          2
        )
      }
    ]
  };
}

export async function handleAutoHealTest(args: { testCaseId: string; failedSelector: string; currentDomSnapshot?: string }) {
  const testCase = await prisma.testCase.findUnique({
    where: { id: args.testCaseId },
    include: { steps: true }
  });

  if (!testCase) throw new Error(`TestCase ${args.testCaseId} not found`);

  const result = await autoHealer.healSelector({
    testCaseId: testCase.id,
    failedStepOrder: 1,
    failedSelector: args.failedSelector,
    currentDomSnapshot: args.currentDomSnapshot || '<button data-testid="submit-btn">Submit</button>',
    errorMessage: `Element not found for selector ${args.failedSelector}`
  });

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
}

export async function handleApproveFix(args: { findingId: string; patchOverride?: string; notes?: string }) {
  const { fixProposalEngine } = await import('@novaqa/ai');
  const result = await fixProposalEngine.approveFix(args.findingId, {
    actor: 'MCP_AGENT',
    patchOverride: args.patchOverride,
    notes: args.notes || 'Approved by MCP Agent'
  });
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
}

export async function handleVerifyFix(args: { findingId: string; scope?: 'FAILED_TEST_ONLY' | 'RELATED_SUITE' | 'FULL_REGRESSION' }) {
  const { verificationEngine } = await import('@novaqa/ai');
  const result = await verificationEngine.verifyFix(args.findingId, {
    scope: args.scope || 'FULL_REGRESSION'
  });
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
}

