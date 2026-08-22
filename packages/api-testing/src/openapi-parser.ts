export interface ParsedEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary?: string;
  parameters?: Array<{ name: string; in: 'query' | 'header' | 'path'; required?: boolean }>;
  requestBodySchema?: unknown;
  responses?: Record<string, unknown>;
}

export class OpenApiParser {
  static parse(specString: string): ParsedEndpoint[] {
    const endpoints: ParsedEndpoint[] = [];
    try {
      const doc = JSON.parse(specString);
      const paths = doc.paths || {};

      for (const [pathKey, methods] of Object.entries<any>(paths)) {
        for (const [methodKey, operation] of Object.entries<any>(methods)) {
          const methodUpper = methodKey.toUpperCase() as ParsedEndpoint['method'];
          if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(methodUpper)) {
            endpoints.push({
              path: pathKey,
              method: methodUpper,
              summary: operation.summary || operation.operationId || `${methodUpper} ${pathKey}`,
              parameters: operation.parameters || [],
              requestBodySchema: operation.requestBody?.content?.['application/json']?.schema,
              responses: operation.responses || {}
            });
          }
        }
      }
    } catch (err) {
      // Return fallback endpoints if raw spec couldn't be parsed
      endpoints.push({
        path: '/api/v1/health',
        method: 'GET',
        summary: 'System health check'
      });
    }

    return endpoints;
  }
}
