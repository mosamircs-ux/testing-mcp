import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { CreateTestSuiteSchema, CreateTestCaseSchema } from '@novaqa/types';
import { NotFoundError, ForbiddenError } from '@novaqa/shared';
import { authMiddleware, requirePermission } from '../middleware/auth';

export const suitesRouter = Router();

// Apply auth middleware to all suites endpoints
suitesRouter.use(authMiddleware);

// 1. Create Test Suite (requires test.create)
suitesRouter.post('/api/v1/suites', requirePermission('test.create'), async (req, res, next) => {
  try {
    const payload = CreateTestSuiteSchema.parse(req.body);

    // Verify project belongs to current organization
    const project = await prisma.project.findFirst({
      where: { id: payload.projectId, organizationId: req.auth!.organizationId }
    });

    if (!project) {
      throw new NotFoundError('Project', payload.projectId);
    }

    const suite = await prisma.testSuite.create({
      data: {
        projectId: payload.projectId,
        name: payload.name,
        description: payload.description,
        tags: JSON.stringify(payload.tags),
        cronSchedule: payload.cronSchedule,
        isActive: payload.isActive
      }
    });

    res.status(201).json({ success: true, data: suite });
  } catch (err) {
    next(err);
  }
});

// 2. Create Test Case inside Suite (requires test.create)
suitesRouter.post('/api/v1/suites/:id/cases', requirePermission('test.create'), async (req, res, next) => {
  try {
    const suite = await prisma.testSuite.findUnique({
      where: { id: req.params.id },
      include: { project: true }
    });

    if (!suite || suite.project.organizationId !== req.auth!.organizationId) {
      throw new NotFoundError('TestSuite', req.params.id);
    }

    const payload = CreateTestCaseSchema.parse({
      ...req.body,
      suiteId: req.params.id
    });

    const testCase = await prisma.testCase.create({
      data: {
        suiteId: payload.suiteId,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        priority: payload.priority,
        expectedResult: payload.expectedResult,
        codeSnippet: payload.codeSnippet,
        autoHealEnabled: payload.autoHealEnabled,
        steps: {
          create: payload.steps.map((step) => ({
            order: step.order,
            action: step.action,
            target: step.target,
            value: step.value,
            description: step.description,
            expectedOutput: step.expectedOutput
          }))
        }
      },
      include: { steps: true }
    });

    res.status(201).json({ success: true, data: testCase });
  } catch (err) {
    next(err);
  }
});

// 3. Delete Test Suite (requires test.delete)
suitesRouter.delete('/api/v1/suites/:id', requirePermission('test.delete'), async (req, res, next) => {
  try {
    const suite = await prisma.testSuite.findUnique({
      where: { id: req.params.id },
      include: { project: true }
    });

    if (!suite || suite.project.organizationId !== req.auth!.organizationId) {
      throw new NotFoundError('TestSuite', req.params.id);
    }

    await prisma.testSuite.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Test suite deleted successfully' });
  } catch (err) {
    next(err);
  }
});
