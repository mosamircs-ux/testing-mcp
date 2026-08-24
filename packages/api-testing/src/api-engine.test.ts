import { describe, it, expect, vi } from 'vitest';
import { OpenApiParser } from './openapi-parser.js';
import { ApiTestEngine } from './api-engine.js';
import { ExecutionContext, Assertions, TestAssertionError } from '@novaqa/testing';
import { TestCase, TestResultStatus } from '@novaqa/types';

describe('Production API Test Engine', () => {
  describe('OpenApiParser', () => {
    it('should parse endpoints from OpenAPI 3 spec JSON', () => {
      const sampleSpec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Sample API', version: '1.0' },
        paths: {
          '/api/v1/orders': {
            get: { summary: 'List orders' },
            post: { summary: 'Create order' }
          },
          '/api/v1/orders/{id}': {
            get: { summary: 'Get order by ID' }
          }
        }
      });

      const parsed = OpenApiParser.parse(sampleSpec);
      expect(parsed.length).toBe(3);
      expect(parsed.some((p) => p.path === '/api/v1/orders' && p.method === 'POST')).toBe(true);
      expect(parsed.some((p) => p.path === '/api/v1/orders' && p.method === 'GET')).toBe(true);
      expect(parsed.some((p) => p.path === '/api/v1/orders/{id}' && p.method === 'GET')).toBe(true);
    });

    it('should fallback gracefully on invalid JSON', () => {
      const parsed = OpenApiParser.parse('invalid-json');
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0].path).toBe('/api/v1/health');
    });
  });

  describe('Assertions & Schema Validation', () => {
    it('should assert equals and notEquals correctly', () => {
      expect(() => Assertions.equals(200, 200)).not.toThrow();
      expect(() => Assertions.equals(404, 200)).toThrow(TestAssertionError);
      expect(() => Assertions.notEquals(500, 200)).not.toThrow();
      expect(() => Assertions.notEquals(200, 200)).toThrow(TestAssertionError);
    });

    it('should assert string includes and regex matching', () => {
      expect(() => Assertions.includes('order created successfully', 'created')).not.toThrow();
      expect(() => Assertions.includes('order failed', 'created')).toThrow(TestAssertionError);
      expect(() => Assertions.matchesRegex('Order #12345', /^Order #\d+$/)).not.toThrow();
      expect(() => Assertions.matchesRegex('Invalid', /^Order #\d+$/)).toThrow(TestAssertionError);
    });

    it('should assert timing metrics and numeric bounds', () => {
      expect(() => Assertions.isLessThan(150, 500)).not.toThrow();
      expect(() => Assertions.isLessThan(600, 500)).toThrow(TestAssertionError);
      expect(() => Assertions.isGreaterThan(50, 10)).not.toThrow();
    });

    it('should validate JSON Schema properties and required fields', () => {
      const payload = { id: 'usr_123', name: 'Alice', active: true, count: 5 };
      const validSchema = {
        required: ['id', 'name', 'active'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          active: { type: 'boolean' },
          count: { type: 'number' }
        }
      };
      expect(() => Assertions.validateSchema(payload, validSchema)).not.toThrow();

      const invalidSchema = {
        required: ['missingField'],
        properties: { id: { type: 'string' } }
      };
      expect(() => Assertions.validateSchema(payload, invalidSchema)).toThrow(TestAssertionError);
    });
  });

  describe('ApiTestEngine Execution & Request Chaining', () => {
    it('should execute chained requests, extract variables, and perform assertions', async () => {
      const engine = new ApiTestEngine();
      const context = new ExecutionContext('run-test-1', 'http://localhost:4000');

      // Mock fetch responses for chained steps
      const mockFetch = vi.fn();
      // Step 1: Login response returning token and user ID
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({
          'content-type': 'application/json',
          'set-cookie': 'session_id=sess_abc123; Path=/;'
        }),
        text: async () => JSON.stringify({ token: 'jwt_token_xyz', user: { id: 'usr_999', role: 'ADMIN' } })
      });
      // Step 3: Fetch profile using interpolated token
      mockFetch.mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ id: 'usr_999', name: 'Super Admin', verified: true })
      });

      global.fetch = mockFetch;

      const testCase: TestCase = {
        id: 'tc-api-chain',
        suiteId: 'suite-1',
        title: 'Auth & Chained Profile Retrieval',
        category: 'API',
        priority: 'HIGH',
        expectedResult: 'Profile retrieved successfully with token',
        isFlaky: false,
        flakinessScore: 0,
        autoHealEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [
          {
            id: 's1',
            testCaseId: 'tc-api-chain',
            order: 1,
            action: 'REQUEST',
            target: 'POST /api/v1/auth/login',
            value: JSON.stringify({
              body: { email: 'admin@acme.com', password: 'Password123!' },
              extract: { authToken: 'token', userId: 'user.id' }
            }),
            description: 'Login to obtain auth token'
          },
          {
            id: 's2',
            testCaseId: 'tc-api-chain',
            order: 2,
            action: 'ASSERT',
            target: 'status',
            expectedOutput: '200',
            description: 'Assert login status 200'
          },
          {
            id: 's3',
            testCaseId: 'tc-api-chain',
            order: 3,
            action: 'REQUEST',
            target: 'GET /api/v1/users/{{userId}}',
            value: JSON.stringify({
              headers: { Authorization: 'Bearer {{authToken}}' }
            }),
            description: 'Fetch user profile using extracted variables'
          },
          {
            id: 's4',
            testCaseId: 'tc-api-chain',
            order: 4,
            action: 'ASSERT',
            target: 'name',
            expectedOutput: 'Super Admin',
            description: 'Assert user name in response'
          }
        ]
      };

      const result = await engine.executeTestCase(testCase, context);
      expect(result.status).toBe(TestResultStatus.PASSED);
      expect(result.stepResults.length).toBe(4);
      expect(context.getVariable('authToken')).toBe('jwt_token_xyz');
      expect(context.getVariable('userId')).toBe('usr_999');
      expect(context.cookies['session_id']).toBe('sess_abc123');
    });

    it('should execute GraphQL queries and validate responses', async () => {
      const engine = new ApiTestEngine();
      const context = new ExecutionContext('run-gql-1', 'http://localhost:4000/graphql');

      global.fetch = vi.fn().mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ data: { project: { id: 'proj_1', name: 'NovaQA' } } })
      });

      const testCase: TestCase = {
        id: 'tc-gql',
        suiteId: 'suite-1',
        title: 'GraphQL Project Query',
        category: 'API',
        priority: 'MEDIUM',
        expectedResult: 'Project returned via GraphQL',
        isFlaky: false,
        flakinessScore: 0,
        autoHealEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: [
          {
            id: 's1',
            testCaseId: 'tc-gql',
            order: 1,
            action: 'GRAPHQL',
            target: '/graphql',
            value: JSON.stringify({
              graphql: {
                query: 'query GetProject($id: ID!) { project(id: $id) { id name } }',
                variables: { id: 'proj_1' }
              }
            }),
            description: 'Execute GraphQL project query'
          },
          {
            id: 's2',
            testCaseId: 'tc-gql',
            order: 2,
            action: 'ASSERT',
            target: 'data.project.name',
            expectedOutput: 'NovaQA',
            description: 'Assert project name'
          }
        ]
      };

      const result = await engine.executeTestCase(testCase, context);
      expect(result.status).toBe(TestResultStatus.PASSED);
    });
  });
});
