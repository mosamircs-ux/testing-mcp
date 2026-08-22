import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { CreateTestSuiteSchema, CreateTestCaseSchema } from '@novaqa/types';
import { NotFoundError } from '@novaqa/shared';

export const suitesRouter = Router();

// Create Test Suite
suitesRouter.post('/api/v1/suites', async (req, res, next) => {
  try {
    const payload = CreateTestSuiteSchema.parse(req.body);

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

// Create Test Case inside Suite
suitesRouter.post('/api/v1/suites/:id/cases', async (req, res, next) => {
  try {
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
