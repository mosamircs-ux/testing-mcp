import { describe, it, expect } from 'vitest';
import { OpenApiParser } from './openapi-parser.js';
import { Assertions, TestAssertionError } from '@novaqa/testing';

describe('API Testing Package', () => {
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

  describe('Assertions', () => {
    it('should assert equals correctly', () => {
      expect(() => Assertions.equals(200, 200)).not.toThrow();
      expect(() => Assertions.equals(404, 200)).toThrow(TestAssertionError);
    });

    it('should assert string includes correctly', () => {
      expect(() => Assertions.includes('order created successfully', 'created')).not.toThrow();
      expect(() => Assertions.includes('order failed', 'created')).toThrow(TestAssertionError);
    });

    it('should assert json match correctly', () => {
      const payload = { status: 'success', data: { id: 101, name: 'Tee' } };
      expect(() => Assertions.matchesJson(payload, { status: 'success' })).not.toThrow();
      expect(() => Assertions.matchesJson(payload, { status: 'error' })).toThrow(TestAssertionError);
    });
  });
});
