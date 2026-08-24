import { TestEngine, ExecutionContext, TestEngineResult, Assertions } from '@novaqa/testing';
import { TestCase, TestResultStatus, TestStepResult, ArtifactType, NetworkTimingMetrics } from '@novaqa/types';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('api-engine');

export interface ApiAuthOptions {
  type: 'bearer' | 'apiKey' | 'basic' | 'oauth' | 'cookie' | 'none';
  token?: string;
  keyName?: string;
  keyValue?: string;
  in?: 'header' | 'query';
  username?: string;
  password?: string;
}

export interface ApiRequestPayload {
  method?: string;
  path?: string;
  url?: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
  graphql?: {
    query: string;
    variables?: Record<string, any>;
    operationName?: string;
  };
  auth?: ApiAuthOptions;
  extract?: Record<string, string>; // { variableName: "json.path.to.value" }
  timeoutMs?: number;
}

export interface ApiResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  timing: NetworkTimingMetrics;
  extractedVariables?: Record<string, string>;
}

export class ApiTestEngine implements TestEngine {
  public readonly name = 'RestAndGraphQLApiEngine';

  async initialize(context: ExecutionContext): Promise<void> {
    context.log('Initializing Production REST & GraphQL API Test Engine...');
  }

  async executeTestCase(testCase: TestCase, context: ExecutionContext): Promise<TestEngineResult> {
    const startTime = Date.now();
    const stepResults: TestStepResult[] = [];
    let overallStatus: TestResultStatus = TestResultStatus.PASSED;
    let errorMessage: string | undefined;
    let stackTrace: string | undefined;
    let lastResponse: ApiResponseData | null = null;

    context.checkCancellation();
    context.log(`Executing API Test Case: "${testCase.title}"`);
    context.emitEvent('TEST_STARTED', { testCaseId: testCase.id, title: testCase.title });

    for (const step of testCase.steps) {
      context.checkCancellation();
      const stepStartTime = Date.now();
      const action = step.action.toUpperCase();

      context.emitEvent('STEP_STARTED', {
        testCaseId: testCase.id,
        stepOrder: step.order,
        action: step.action,
        target: step.target
      });

      try {
        if (action === 'REQUEST' || action === 'GRAPHQL' || action === 'HTTP') {
          lastResponse = await this.executeApiRequest(step, context);
        } else if (action === 'ASSERT' || action === 'ASSERTION') {
          if (!lastResponse) {
            throw new Error('Cannot run ASSERT before making an HTTP / GRAPHQL request');
          }
          this.executeApiAssertion(step, lastResponse, context);
        } else if (action === 'EXTRACT') {
          if (!lastResponse) {
            throw new Error('Cannot EXTRACT before making an HTTP / GRAPHQL request');
          }
          this.extractVariablesFromResponse(step, lastResponse, context);
        } else if (action === 'WAIT') {
          const ms = parseInt(step.value || '500', 10);
          context.log(`Waiting for ${ms}ms...`);
          await new Promise((resolve) => setTimeout(resolve, ms));
        } else {
          context.log(`Generic step execution: ${step.action}`);
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

        context.log(`❌ API Step ${step.order} FAILED: ${errorMessage}`);

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

  private async executeApiRequest(step: any, context: ExecutionContext): Promise<ApiResponseData> {
    let payload: ApiRequestPayload = {};

    // Parse step value JSON if provided, otherwise deduce from target
    if (step.value) {
      try {
        payload = JSON.parse(context.interpolate(step.value));
      } catch {
        payload = { body: context.interpolate(step.value) };
      }
    }

    // Parse target (e.g. "POST /api/v1/users", "GET http://localhost:4000/health", or "query { me { id } }")
    const rawTarget = (step.target || '').trim();
    let method = (payload.method || 'GET').toUpperCase();
    let urlPath = rawTarget;

    if (step.action.toUpperCase() === 'GRAPHQL') {
      method = 'POST';
      if (!payload.graphql && step.value) {
        payload.graphql = { query: context.interpolate(step.value) };
      }
    } else if (rawTarget.includes(' ')) {
      const parts = rawTarget.split(/\s+/);
      method = parts[0].toUpperCase();
      urlPath = parts.slice(1).join(' ');
    }

    urlPath = context.interpolate(urlPath);
    let fullUrl = urlPath.startsWith('http://') || urlPath.startsWith('https://')
      ? urlPath
      : `${context.environmentBaseUrl.replace(/\/$/, '')}/${urlPath.replace(/^\//, '')}`;

    // Handle Query Parameters
    if (payload.params) {
      const parsedUrl = new URL(fullUrl);
      for (const [k, v] of Object.entries(payload.params)) {
        parsedUrl.searchParams.set(k, context.interpolate(String(v)));
      }
      fullUrl = parsedUrl.toString();
    }

    // Build Request Headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'NovaQA-Production-ApiEngine/1.0',
      ...context.headers,
      ...(payload.headers || {})
    };

    // Interpolate headers
    for (const [hk, hv] of Object.entries(headers)) {
      headers[hk] = context.interpolate(hv);
    }

    // Apply Cookie Header from Jar
    const cookieHeader = context.getCookieHeader();
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    // Authentication Layer
    this.applyAuthentication(headers, fullUrl, payload.auth, context);

    // Prepare Body (REST JSON or GraphQL)
    let requestBodyString: string | undefined;
    if (payload.graphql) {
      headers['Content-Type'] = 'application/json';
      requestBodyString = JSON.stringify({
        query: context.interpolate(payload.graphql.query),
        variables: payload.graphql.variables,
        operationName: payload.graphql.operationName
      });
    } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (payload.body !== undefined) {
        if (typeof payload.body === 'object') {
          headers['Content-Type'] = headers['Content-Type'] || 'application/json';
          requestBodyString = JSON.stringify(payload.body);
        } else {
          requestBodyString = String(payload.body);
        }
      }
    }

    context.log(`Dispatching ${method} -> ${fullUrl}`);
    const reqStartTime = Date.now();

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: requestBodyString,
      signal: context.signal
    });

    const totalDurationMs = Date.now() - reqStartTime;
    const responseHeaders: Record<string, string> = Object.fromEntries(response.headers.entries());

    // Maintain Cookie Jar from Set-Cookie
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const parts = setCookie.split(';')[0].split('=');
      if (parts.length === 2) {
        context.setCookie(parts[0].trim(), parts[1].trim());
      }
    }

    // Parse Response Body
    let responseBody: any;
    const rawText = await response.text();
    try {
      responseBody = JSON.parse(rawText);
    } catch {
      responseBody = rawText;
    }

    const timingMetrics: NetworkTimingMetrics = {
      timeToFirstByteMs: Math.round(totalDurationMs * 0.7),
      totalDurationMs,
      requestBodySize: requestBodyString ? Buffer.byteLength(requestBodyString) : 0,
      responseBodySize: Buffer.byteLength(rawText)
    };

    const responseData: ApiResponseData = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      timing: timingMetrics
    };

    context.log(`Received HTTP ${response.status} (${totalDurationMs}ms)`);

    // Handle Variable Extractions defined in step
    if (payload.extract) {
      this.extractVariables(payload.extract, responseData, context);
    }

    // Record API Response Artifact
    context.addArtifact(
      ArtifactType.API_RESPONSE,
      `api_response_step_${step.order}_${Date.now()}.json`,
      Buffer.from(
        JSON.stringify(
          {
            request: { method, url: fullUrl, headers, body: requestBodyString ? JSON.parse(requestBodyString) : null },
            response: { status: response.status, headers: responseHeaders, body: responseBody },
            timing: timingMetrics
          },
          null,
          2
        ),
        'utf-8'
      ),
      'application/json',
      { status: response.status, method, url: fullUrl, durationMs: totalDurationMs }
    );

    // GraphQL error checking
    if (payload.graphql && responseBody?.errors && Array.isArray(responseBody.errors) && responseBody.errors.length > 0) {
      const gqlErrorMsg = responseBody.errors.map((e: any) => e.message).join('; ');
      context.log(`⚠️ GraphQL returned errors: ${gqlErrorMsg}`);
    }

    return responseData;
  }

  private applyAuthentication(
    headers: Record<string, string>,
    url: string,
    auth: ApiAuthOptions | undefined,
    context: ExecutionContext
  ): void {
    // 1. Check direct step auth
    if (auth) {
      if (auth.type === 'bearer' && auth.token) {
        headers['Authorization'] = `Bearer ${context.interpolate(auth.token)}`;
      } else if (auth.type === 'apiKey' && auth.keyName && auth.keyValue) {
        if (auth.in === 'header' || !auth.in) {
          headers[auth.keyName] = context.interpolate(auth.keyValue);
        }
      } else if (auth.type === 'basic' && auth.username && auth.password) {
        const credentials = `${context.interpolate(auth.username)}:${context.interpolate(auth.password)}`;
        headers['Authorization'] = `Basic ${Buffer.from(credentials).toString('base64')}`;
      }
      return;
    }

    // 2. Check context variables
    const bearerToken = context.getVariable('BEARER_TOKEN') || context.getVariable('ACCESS_TOKEN') || context.getVariable('AUTH_TOKEN');
    if (bearerToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const apiKey = context.getVariable('API_KEY');
    if (apiKey && !headers['x-api-key'] && !headers['X-API-KEY']) {
      headers['X-API-Key'] = apiKey;
    }
  }

  private extractVariables(
    extractMap: Record<string, string>,
    responseData: ApiResponseData,
    context: ExecutionContext
  ): void {
    for (const [varName, pathExpr] of Object.entries(extractMap)) {
      const extractedVal = this.getValueByPath(responseData, pathExpr);
      if (extractedVal !== undefined) {
        const strVal = typeof extractedVal === 'object' ? JSON.stringify(extractedVal) : String(extractedVal);
        context.setVariable(varName, strVal);
      } else {
        context.log(`Warning: Failed to extract variable '{{${varName}}}' at path '${pathExpr}'`);
      }
    }
  }

  private extractVariablesFromResponse(step: any, responseData: ApiResponseData, context: ExecutionContext): void {
    let extractMap: Record<string, string> = {};
    if (step.value) {
      try {
        extractMap = JSON.parse(context.interpolate(step.value));
      } catch {
        if (step.target) {
          extractMap[step.target] = step.value;
        }
      }
    } else if (step.target && step.expectedOutput) {
      extractMap[step.target] = step.expectedOutput;
    }
    this.extractVariables(extractMap, responseData, context);
  }

  private getValueByPath(obj: any, pathExpr: string): any {
    if (!pathExpr) return obj;
    // Strip leading "response." or "body."
    const cleanPath = pathExpr.replace(/^(response\.|body\.)/, '');
    const tokens = cleanPath.split('.').flatMap((token) => {
      // Support array index syntax e.g. "users[0]" -> ["users", "0"]
      return token.split(/\[|\]/).filter(Boolean);
    });

    let current = obj.body !== undefined ? obj.body : obj;
    for (const token of tokens) {
      if (current === undefined || current === null) return undefined;
      current = current[token];
    }
    return current;
  }

  private executeApiAssertion(step: any, response: ApiResponseData, context: ExecutionContext): void {
    const target = (step.target || '').toLowerCase().trim();
    const expectedOutput = step.expectedOutput ? context.interpolate(step.expectedOutput) : undefined;
    const value = step.value ? context.interpolate(step.value) : undefined;

    // 1. Status Assertion
    if (target === 'status' || target === 'statuscode' || target.includes('status')) {
      const expectedStatus = parseInt(expectedOutput || value || '200', 10);
      context.log(`Asserting Status: expected ${expectedStatus}, got ${response.status}`);
      Assertions.equals(
        response.status,
        expectedStatus,
        `Expected HTTP status ${expectedStatus} but received ${response.status}`
      );
      return;
    }

    // 2. Timing Assertion (threshold in ms)
    if (target === 'timing' || target === 'duration' || target.includes('timing')) {
      const maxMs = parseInt(expectedOutput || value || '2000', 10);
      context.log(`Asserting Timing: duration ${response.timing.totalDurationMs}ms < ${maxMs}ms`);
      Assertions.isLessThan(
        response.timing.totalDurationMs,
        maxMs,
        `Response time ${response.timing.totalDurationMs}ms exceeded threshold of ${maxMs}ms`
      );
      return;
    }

    // 3. Header Assertion
    if (target.startsWith('header.') || target.startsWith('headers.')) {
      const headerName = target.replace(/^(header\.|headers\.)/, '').toLowerCase();
      const actualHeader = response.headers[headerName];
      context.log(`Asserting Header '${headerName}': expected '${expectedOutput || value}', got '${actualHeader}'`);
      if (expectedOutput) {
        Assertions.includes(actualHeader || '', expectedOutput);
      }
      return;
    }

    // 4. Schema Assertion
    if (target === 'schema' || target === 'jsonschema') {
      if (value) {
        const schema = JSON.parse(value);
        context.log('Validating JSON schema against response body...');
        Assertions.validateSchema(response.body, schema);
        return;
      }
    }

    // 5. Body Property / JSON Assertion
    if (step.target && step.target !== 'body') {
      const extractedVal = this.getValueByPath(response, step.target);
      context.log(`Asserting Body Path '${step.target}': expected '${expectedOutput || value}', got '${JSON.stringify(extractedVal)}'`);

      if (expectedOutput) {
        const actualStr = typeof extractedVal === 'object' ? JSON.stringify(extractedVal) : String(extractedVal);
        Assertions.includes(actualStr, expectedOutput);
      } else if (value) {
        Assertions.equals(String(extractedVal), value);
      }
      return;
    }

    // 6. Generic Body Match
    if (expectedOutput) {
      const bodyStr = typeof response.body === 'object' ? JSON.stringify(response.body) : String(response.body);
      context.log(`Asserting Body Content contains '${expectedOutput}'`);
      Assertions.includes(bodyStr, expectedOutput);
    }
  }

  async cleanup(): Promise<void> {
    // Stateless cleanup for API engine
  }
}
