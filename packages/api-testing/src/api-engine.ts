import { TestEngine, ExecutionContext, TestEngineResult, Assertions } from '@novaqa/testing';
import { TestCase, TestResultStatus, TestStepResult, ArtifactType } from '@novaqa/types';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('api-engine');

export class ApiTestEngine implements TestEngine {
  public readonly name = 'RestApiTestEngine';

  async initialize(context: ExecutionContext): Promise<void> {
    context.log('Initializing REST/API execution engine...');
  }

  async executeTestCase(testCase: TestCase, context: ExecutionContext): Promise<TestEngineResult> {
    const startTime = Date.now();
    const stepResults: TestStepResult[] = [];
    let overallStatus: TestResultStatus = TestResultStatus.PASSED;
    let errorMessage: string | undefined;
    let stackTrace: string | undefined;
    let lastResponse: { status: number; body: any; headers: any } | null = null;

    context.log(`Executing API Test Case: "${testCase.title}"`);
    context.emitEvent('TEST_STARTED', { testCaseId: testCase.id, title: testCase.title });

    for (const step of testCase.steps) {
      const stepStartTime = Date.now();
      context.emitEvent('STEP_STARTED', { testCaseId: testCase.id, stepOrder: step.order, action: step.action });

      try {
        if (step.action === 'REQUEST') {
          // Parse method and path (e.g. "POST /api/v1/orders")
          const parts = (step.target || 'GET /').trim().split(/\s+/);
          const method = parts.length > 1 ? parts[0] : 'GET';
          const path = parts.length > 1 ? parts[1] : parts[0];
          const url = path.startsWith('http') ? path : `${context.environmentBaseUrl}${path}`;

          context.log(`Dispatching HTTP ${method} to: ${url}`);
          let parsedBody: any;
          if (step.value) {
            try {
              parsedBody = JSON.parse(step.value);
            } catch {
              parsedBody = step.value;
            }
          }

          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...context.variables
            },
            body: ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && parsedBody ? JSON.stringify(parsedBody) : undefined
          });

          let responseData: any;
          const text = await response.text();
          try {
            responseData = JSON.parse(text);
          } catch {
            responseData = text;
          }

          lastResponse = {
            status: response.status,
            body: responseData,
            headers: Object.fromEntries(response.headers.entries())
          };

          context.log(`Received HTTP ${response.status}`, { status: response.status });
          context.addArtifact(
            ArtifactType.API_RESPONSE,
            `response_step_${step.order}.json`,
            Buffer.from(JSON.stringify(lastResponse, null, 2)),
            'application/json'
          );
        } else if (step.action === 'ASSERT') {
          if (!lastResponse) {
            throw new Error('Cannot assert before making an HTTP REQUEST step');
          }

          if (step.target === 'status' || step.target?.includes('status')) {
            const expectedStatus = parseInt(step.expectedOutput || '200', 10);
            Assertions.equals(lastResponse.status, expectedStatus, `Expected HTTP status ${expectedStatus} but got ${lastResponse.status}`);
          } else if (step.expectedOutput) {
            Assertions.includes(JSON.stringify(lastResponse.body), step.expectedOutput);
          }
        }

        const duration = Date.now() - stepStartTime;
        stepResults.push({
          stepId: step.id || `step-${step.order}`,
          order: step.order,
          action: step.action,
          target: step.target,
          status: 'PASSED',
          durationMs: duration
        });

        context.emitEvent('STEP_COMPLETED', {
          testCaseId: testCase.id,
          stepOrder: step.order,
          durationMs: duration
        });
      } catch (err: any) {
        const duration = Date.now() - stepStartTime;
        overallStatus = TestResultStatus.FAILED;
        errorMessage = err.message || 'API Test Step Failed';
        stackTrace = err.stack;

        stepResults.push({
          stepId: step.id || `step-${step.order}`,
          order: step.order,
          action: step.action,
          target: step.target,
          status: 'FAILED',
          durationMs: duration,
          error: errorMessage
        });

        context.emitEvent('STEP_FAILED', {
          testCaseId: testCase.id,
          stepOrder: step.order,
          error: errorMessage
        });
        break;
      }
    }

    const durationMs = Date.now() - startTime;
    context.emitEvent('TEST_COMPLETED', {
      testCaseId: testCase.id,
      status: overallStatus,
      durationMs
    });

    return {
      status: overallStatus,
      durationMs,
      errorMessage,
      stackTrace,
      stepResults
    };
  }

  async cleanup(): Promise<void> {
    // No-op for HTTP client
  }
}
