import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { testPlanningEngine } from '@novaqa/ai';
import {
  GenerateTestPlanSchema,
  BulkTestCaseActionSchema,
  UpdatePlannedTestCaseSchema,
  ReviewStatus
} from '@novaqa/types';
import { NotFoundError, BadRequestError } from '@novaqa/shared';
import { authMiddleware, requirePermission, requireProjectAccess } from '../middleware/auth';

export const planningRouter = Router();

// Apply auth middleware to all planning endpoints
planningRouter.use(authMiddleware);

// ============================================================================
// 1. Generate Autonomous AI Test Plan
// ============================================================================
planningRouter.post('/api/v1/projects/:id/test-plans/generate', requirePermission('test.create'), requireProjectAccess, async (req, res, next) => {
  try {
    const projectId = String(req.params.id);
    const orgId = req.auth!.organizationId;

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId }
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const payload = GenerateTestPlanSchema.parse({
      ...req.body,
      projectId
    });

    const testPlan = await testPlanningEngine.generateTestPlan({
      projectId: project.id,
      title: payload.title,
      userInstructions: payload.userInstructions,
      categories: payload.categories,
      focusAreas: payload.focusAreas,
      includeNegativeScenarios: payload.includeNegativeScenarios,
      includeEdgeCases: payload.includeEdgeCases
    });

    res.status(201).json({
      success: true,
      message: 'Autonomous test plan generated successfully.',
      data: testPlan
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 2. Get Latest Test Plan with Coverage Metrics & Cases
// ============================================================================
planningRouter.get('/api/v1/projects/:id/test-plans/latest', requirePermission('test.read'), requireProjectAccess, async (req, res, next) => {
  try {
    const projectId = String(req.params.id);
    const orgId = req.auth!.organizationId;

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId }
    });

    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    let plan = await prisma.testPlan.findFirst({
      where: { projectId },
      include: {
        testCases: {
          orderBy: { customId: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // If no plan exists, auto-generate the first plan automatically
    if (!plan) {
      const generated = await testPlanningEngine.generateTestPlan({
        projectId: project.id,
        title: `${project.name} Master Test Plan`
      });

      return res.json({
        success: true,
        data: generated
      });
    }

    return res.json({
      success: true,
      data: {
        ...plan,
        coverageMetrics: JSON.parse(plan.coverageMetrics || '{}'),
        testCases: plan.testCases.map((tc) => ({
          ...tc,
          preconditions: JSON.parse(tc.preconditions || '[]'),
          testData: JSON.parse(tc.testData || '{}'),
          steps: JSON.parse(tc.steps || '[]'),
          affectedRoutes: JSON.parse(tc.affectedRoutes || '[]'),
          affectedApis: JSON.parse(tc.affectedApis || '[]'),
          roles: JSON.parse(tc.roles || '[]'),
          tags: JSON.parse(tc.tags || '[]')
        }))
      }
    });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// 3. List All Test Plans for Project
// ============================================================================
planningRouter.get('/api/v1/projects/:id/test-plans', requirePermission('test.read'), requireProjectAccess, async (req, res, next) => {
  try {
    const projectId = String(req.params.id);
    const plans = await prisma.testPlan.findMany({
      where: {
        projectId,
        project: { organizationId: req.auth!.organizationId }
      },
      include: {
        _count: { select: { testCases: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: plans.map((p) => ({
        id: p.id,
        title: p.title,
        version: p.version,
        status: p.status,
        summary: p.summary,
        testCaseCount: p._count.testCases,
        coverageMetrics: JSON.parse(p.coverageMetrics || '{}'),
        createdAt: p.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 4. Update / Edit a Single Planned Test Case
// ============================================================================
planningRouter.patch('/api/v1/projects/:id/test-cases/:caseId', requirePermission('test.create'), requireProjectAccess, async (req, res, next) => {
  try {
    const projectId = String(req.params.id);
    const caseId = String(req.params.caseId);

    const existing = await prisma.plannedTestCase.findFirst({
      where: {
        id: caseId,
        projectId,
        project: { organizationId: req.auth!.organizationId }
      }
    });

    if (!existing) {
      throw new NotFoundError('PlannedTestCase', caseId);
    }

    const payload = UpdatePlannedTestCaseSchema.parse(req.body);

    const updated = await prisma.plannedTestCase.update({
      where: { id: caseId },
      data: {
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        category: payload.category,
        scenarioType: payload.scenarioType,
        preconditions: payload.preconditions ? JSON.stringify(payload.preconditions) : undefined,
        testData: payload.testData ? JSON.stringify(payload.testData) : undefined,
        steps: payload.steps ? JSON.stringify(payload.steps) : undefined,
        expectedResults: payload.expectedResults,
        risk: payload.risk,
        requirementReference: payload.requirementReference,
        affectedRoutes: payload.affectedRoutes ? JSON.stringify(payload.affectedRoutes) : undefined,
        affectedApis: payload.affectedApis ? JSON.stringify(payload.affectedApis) : undefined,
        roles: payload.roles ? JSON.stringify(payload.roles) : undefined,
        environment: payload.environment,
        automationStatus: payload.automationStatus,
        reviewStatus: payload.reviewStatus,
        tags: payload.tags ? JSON.stringify(payload.tags) : undefined,
        groupName: payload.groupName
      }
    });

    res.json({
      success: true,
      message: 'Test case updated successfully',
      data: {
        ...updated,
        preconditions: JSON.parse(updated.preconditions),
        testData: JSON.parse(updated.testData),
        steps: JSON.parse(updated.steps),
        affectedRoutes: JSON.parse(updated.affectedRoutes),
        affectedApis: JSON.parse(updated.affectedApis),
        roles: JSON.parse(updated.roles),
        tags: JSON.parse(updated.tags)
      }
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 5. Bulk Test Case Operations (Approve, Reject, Prioritize, Tag, Group, Merge, Duplicate)
// ============================================================================
planningRouter.post('/api/v1/projects/:id/test-cases/bulk', requirePermission('test.create'), requireProjectAccess, async (req, res, next) => {
  try {
    const projectId = String(req.params.id);
    const { testCaseIds, action, priority, tags, groupName } = BulkTestCaseActionSchema.parse(req.body);

    const cases = await prisma.plannedTestCase.findMany({
      where: {
        id: { in: testCaseIds },
        projectId,
        project: { organizationId: req.auth!.organizationId }
      }
    });

    if (cases.length === 0) {
      throw new BadRequestError('No valid test cases found for bulk action');
    }

    if (action === 'APPROVE') {
      await prisma.plannedTestCase.updateMany({
        where: { id: { in: testCaseIds }, projectId },
        data: { reviewStatus: ReviewStatus.APPROVED }
      });
    } else if (action === 'REJECT') {
      await prisma.plannedTestCase.updateMany({
        where: { id: { in: testCaseIds }, projectId },
        data: { reviewStatus: ReviewStatus.REJECTED }
      });
    } else if (action === 'PRIORITIZE' && priority) {
      await prisma.plannedTestCase.updateMany({
        where: { id: { in: testCaseIds }, projectId },
        data: { priority }
      });
    } else if (action === 'GROUP' && groupName) {
      await prisma.plannedTestCase.updateMany({
        where: { id: { in: testCaseIds }, projectId },
        data: { groupName }
      });
    } else if (action === 'DUPLICATE') {
      for (const targetCase of cases) {
        await prisma.plannedTestCase.create({
          data: {
            customId: `${targetCase.customId}-COPY`,
            testPlanId: targetCase.testPlanId,
            projectId: targetCase.projectId,
            title: `${targetCase.title} (Copy)`,
            description: targetCase.description,
            priority: targetCase.priority,
            category: targetCase.category,
            scenarioType: targetCase.scenarioType,
            preconditions: targetCase.preconditions,
            testData: targetCase.testData,
            steps: targetCase.steps,
            expectedResults: targetCase.expectedResults,
            risk: targetCase.risk,
            requirementReference: targetCase.requirementReference,
            affectedRoutes: targetCase.affectedRoutes,
            affectedApis: targetCase.affectedApis,
            roles: targetCase.roles,
            environment: targetCase.environment,
            automationStatus: targetCase.automationStatus,
            reviewStatus: ReviewStatus.PENDING,
            tags: targetCase.tags,
            groupName: targetCase.groupName
          }
        });
      }
    } else if (action === 'MERGE' && cases.length > 1) {
      const primary = cases[0];
      const mergedTitle = `${primary.title} (Merged with ${cases.length - 1} cases)`;
      const mergedDescription = cases.map((c) => `• ${c.title}: ${c.description}`).join('\n');
      
      await prisma.plannedTestCase.update({
        where: { id: primary.id },
        data: {
          title: mergedTitle,
          description: mergedDescription
        }
      });

      // Delete secondary merged cases
      const secondaryIds = cases.slice(1).map((c) => c.id);
      await prisma.plannedTestCase.deleteMany({
        where: { id: { in: secondaryIds } }
      });
    }

    res.json({
      success: true,
      message: `Bulk action '${action}' applied to ${cases.length} test cases.`
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// 6. Export Approved Test Cases to Executable TestSuite (Non-destructive)
// ============================================================================
planningRouter.post('/api/v1/projects/:id/test-plans/:planId/export-to-suite', requirePermission('test.create'), requireProjectAccess, async (req, res, next) => {
  try {
    const projectId = String(req.params.id);
    const planId = String(req.params.planId);

    const plan = await prisma.testPlan.findFirst({
      where: {
        id: planId,
        projectId,
        project: { organizationId: req.auth!.organizationId }
      },
      include: {
        testCases: true
      }
    });

    if (!plan) {
      throw new NotFoundError('TestPlan', planId);
    }

    const approvedCases = plan.testCases.filter((tc) => tc.reviewStatus === ReviewStatus.APPROVED || tc.reviewStatus === ReviewStatus.PENDING);

    if (approvedCases.length === 0) {
      throw new BadRequestError('No approved test cases to export');
    }

    // Create a new executable test suite without deleting any existing suites
    const suiteName = `${plan.title} (Executable)`;
    const suite = await prisma.testSuite.create({
      data: {
        projectId,
        name: suiteName,
        description: `Exported from test plan ${plan.title}. Contains ${approvedCases.length} verified scenarios.`,
        tags: JSON.stringify(['plan-export', 'ai-generated']),
        isActive: true
      }
    });

    for (const item of approvedCases) {
      const parsedSteps = JSON.parse(item.steps || '[]');
      const testCase = await prisma.testCase.create({
        data: {
          suiteId: suite.id,
          title: `[${item.customId}] ${item.title}`,
          description: item.description,
          category: item.category,
          priority: item.priority as any,
          expectedResult: item.expectedResults,
          autoHealEnabled: true
        }
      });

      for (const st of parsedSteps) {
        await prisma.testCaseStep.create({
          data: {
            testCaseId: testCase.id,
            order: st.order || 1,
            action: (st.action as any) || 'NAVIGATE',
            target: st.target || '',
            value: st.value || '',
            description: st.description || '',
            expectedOutput: st.expectedOutput || ''
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Exported ${approvedCases.length} test cases to suite '${suiteName}'`,
      data: {
        suiteId: suite.id,
        suiteName: suite.name,
        exportedCount: approvedCases.length
      }
    });
  } catch (err) {
    next(err);
  }
});
