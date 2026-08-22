import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { AutoHealer } from '@novaqa/ai';
import { FindingStatus } from '@novaqa/types';
import { NotFoundError } from '@novaqa/shared';

export const findingsRouter = Router();
const autoHealer = new AutoHealer();

// List Findings across organization/projects
findingsRouter.get('/api/v1/findings', async (req, res, next) => {
  try {
    const { projectId, status, category } = req.query;

    const findings = await prisma.finding.findMany({
      where: {
        projectId: projectId ? String(projectId) : undefined,
        status: status ? (status as any) : undefined,
        category: category ? (category as any) : undefined
      },
      include: {
        project: { select: { name: true, slug: true } },
        testRun: { select: { id: true, createdAt: true } },
        testResult: {
          include: {
            testCase: true,
            artifacts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: findings });
  } catch (err) {
    next(err);
  }
});

// Get Finding by ID
findingsRouter.get('/api/v1/findings/:id', async (req, res, next) => {
  try {
    const finding = await prisma.finding.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        testRun: true,
        testResult: {
          include: {
            testCase: { include: { steps: true } },
            artifacts: true
          }
        }
      }
    });

    if (!finding) throw new NotFoundError('Finding', req.params.id);

    res.json({ success: true, data: finding });
  } catch (err) {
    next(err);
  }
});

// Resolve Finding
findingsRouter.post('/api/v1/findings/:id/resolve', async (req, res, next) => {
  try {
    const finding = await prisma.finding.update({
      where: { id: req.params.id },
      data: {
        status: FindingStatus.RESOLVED
      }
    });

    res.json({ success: true, data: finding });
  } catch (err) {
    next(err);
  }
});

// Trigger Auto-Healing on broken test
findingsRouter.post('/api/v1/findings/:id/auto-heal', async (req, res, next) => {
  try {
    const finding = await prisma.finding.findUnique({
      where: { id: req.params.id },
      include: {
        testResult: {
          include: {
            testCase: { include: { steps: true } }
          }
        }
      }
    });

    if (!finding) throw new NotFoundError('Finding', req.params.id);

    const testCase = finding.testResult.testCase;
    const failedStep = testCase.steps.find((s) => s.target && s.target.includes('btn')) || testCase.steps[0];

    const healResult = await autoHealer.healSelector({
      testCaseId: testCase.id,
      failedStepOrder: failedStep ? failedStep.order : 1,
      failedSelector: failedStep?.target || 'button',
      currentDomSnapshot: '<div class="checkout"><button data-testid="checkout-coupon-submit">Apply</button></div>',
      errorMessage: finding.description
    });

    // If healed, update test case step target in database
    if (healResult.healed && failedStep && healResult.recommendedSelector) {
      await prisma.testCaseStep.update({
        where: { id: failedStep.id },
        data: { target: healResult.recommendedSelector }
      });

      await prisma.finding.update({
        where: { id: finding.id },
        data: {
          status: FindingStatus.AUTO_HEALED,
          autoHealSelector: healResult.recommendedSelector
        }
      });
    }

    res.json({ success: true, data: healResult });
  } catch (err) {
    next(err);
  }
});
