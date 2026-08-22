import { AIClient, aiClient } from './client';
import { AIGenerateTestsInput } from '@novaqa/types';

export interface GeneratedTestCase {
  title: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  expectedResult: string;
  codeSnippet?: string;
  steps: Array<{
    order: number;
    action: 'NAVIGATE' | 'CLICK' | 'TYPE' | 'ASSERT' | 'HOVER' | 'SCROLL' | 'REQUEST' | 'WAIT';
    target?: string;
    value?: string;
    description: string;
    expectedOutput?: string;
  }>;
}

export interface GeneratedTestBatch {
  testCases: GeneratedTestCase[];
}

export class TestGenerator {
  constructor(private client: AIClient = aiClient) {}

  async generateTests(input: AIGenerateTestsInput): Promise<GeneratedTestBatch> {
    const systemPrompt = `You are an Autonomous Test Generation Engine. Given a feature specification, user story, or API schema, generate complete, deterministic, executable test scenarios with step-by-step actions (NAVIGATE, CLICK, TYPE, ASSERT, REQUEST) and Playwright TypeScript code snippets. Return valid JSON adhering to: { "testCases": Array<{ "title": string, "category": string, "priority": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW", "expectedResult": string, "codeSnippet": string, "steps": Array<{ "order": number, "action": string, "target": string, "value"?: string, "description": string, "expectedOutput"?: string }> }> }`;

    const userPrompt = `action: generate_tests\nFeature: ${input.featureDescription}\nTargetUrl: ${input.targetUrl || ''}\nCategories: ${input.categories.join(', ')}`;

    const response = await this.client.generate<GeneratedTestBatch>({
      systemPrompt,
      userPrompt,
      responseFormat: 'json',
      temperature: 0.2
    });

    if (!response.parsed?.testCases) {
      return {
        testCases: [
          {
            title: `Verify ${input.featureDescription.slice(0, 40)} loads correctly`,
            category: 'functional',
            priority: 'HIGH',
            expectedResult: 'Element renders without errors',
            codeSnippet: `await page.goto('${input.targetUrl || '/'}');\nawait expect(page).toHaveTitle(/.*App.*/);`,
            steps: [
              { order: 1, action: 'NAVIGATE', target: input.targetUrl || '/', description: 'Open page' },
              { order: 2, action: 'ASSERT', target: 'body', description: 'Assert body is visible' }
            ]
          }
        ]
      };
    }

    return response.parsed;
  }
}
