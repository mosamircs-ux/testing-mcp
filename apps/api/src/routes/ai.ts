import { Router } from 'express';
import { ProjectAnalyzer, TestGenerator, FailureAnalyzer, AutoHealer } from '@novaqa/ai';
import { AIAnalyzeProjectSchema, AIGenerateTestsSchema, AIFailureTriageSchema, AIAutoHealSchema } from '@novaqa/types';
import { prisma } from '@novaqa/database';

export const aiRouter = Router();

const projectAnalyzer = new ProjectAnalyzer();
const testGenerator = new TestGenerator();
const failureAnalyzer = new FailureAnalyzer();
const autoHealer = new AutoHealer();

// AI Project Specification & Flow Discovery
aiRouter.post('/api/v1/ai/analyze-project', async (req, res, next) => {
  try {
    const payload = AIAnalyzeProjectSchema.parse(req.body);
    const result = await projectAnalyzer.analyze(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// AI Test Generation
aiRouter.post('/api/v1/ai/generate-tests', async (req, res, next) => {
  try {
    const payload = AIGenerateTestsSchema.parse(req.body);
    const result = await testGenerator.generateTests(payload);

    // If suiteId was provided, automatically persist generated tests to database
    if (payload.suiteId && result.testCases?.length) {
      for (const tc of result.testCases) {
        await prisma.testCase.create({
          data: {
            suiteId: payload.suiteId,
            title: tc.title,
            category: tc.category,
            priority: tc.priority,
            expectedResult: tc.expectedResult,
            codeSnippet: tc.codeSnippet,
            steps: {
              create: tc.steps.map((s) => ({
                order: s.order,
                action: s.action,
                target: s.target,
                value: s.value,
                description: s.description,
                expectedOutput: s.expectedOutput
              }))
            }
          }
        });
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// AI Failure Triage
aiRouter.post('/api/v1/ai/triage-failure', async (req, res, next) => {
  try {
    const payload = AIFailureTriageSchema.parse(req.body);
    const result = await failureAnalyzer.analyzeFailure(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// AI Auto-Healer
aiRouter.post('/api/v1/ai/auto-heal', async (req, res, next) => {
  try {
    const payload = AIAutoHealSchema.parse(req.body);
    const result = await autoHealer.healSelector(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
