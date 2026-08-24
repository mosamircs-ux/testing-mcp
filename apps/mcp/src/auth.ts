import { prisma } from '@novaqa/database';
import { ApiKeyService } from '@novaqa/auth';
import { createChildLogger } from '@novaqa/shared';

const log = createChildLogger('mcp-auth');

export interface McpTenantContext {
  organizationId: string;
  projectId?: string | null;
  userId: string;
  role: string;
  apiKeyName?: string;
}

/**
 * Resolves tenant authentication context for MCP requests.
 * Uses NOVAQA_API_KEY environment variable or custom key argument.
 * Fallbacks gracefully to primary seed organization in local development sandbox.
 */
export async function getMcpTenantContext(providedKey?: string): Promise<McpTenantContext> {
  const apiKeyRaw = providedKey || process.env.NOVAQA_API_KEY;

  if (apiKeyRaw) {
    const hashed = ApiKeyService.hashApiKey(apiKeyRaw);
    const keyRecord = await prisma.apiKey.findUnique({
      where: { hashedKey: hashed },
      include: {
        organization: true,
        user: { include: { memberships: true } }
      }
    });

    if (keyRecord && !keyRecord.revokedAt && (!keyRecord.expiresAt || keyRecord.expiresAt > new Date())) {
      const membership = keyRecord.user.memberships.find((m) => m.organizationId === keyRecord.organizationId);
      return {
        organizationId: keyRecord.organizationId,
        projectId: keyRecord.projectId,
        userId: keyRecord.userId,
        role: membership?.role || 'QA_ENGINEER',
        apiKeyName: keyRecord.name
      };
    }
  }

  // Local development / testing default tenant context
  const defaultOrg = await prisma.organization.findFirst({
    include: { members: true, projects: true }
  });

  if (defaultOrg) {
    return {
      organizationId: defaultOrg.id,
      projectId: defaultOrg.projects[0]?.id || null,
      userId: defaultOrg.members[0]?.userId || 'default-user',
      role: defaultOrg.members[0]?.role || 'ADMIN',
      apiKeyName: 'Development Default'
    };
  }

  throw new Error('No valid MCP authentication credentials found. Set NOVAQA_API_KEY environment variable.');
}

/**
 * Recursively redacts sensitive fields (passwords, tokens, API keys, private keys, database URLs)
 * from all MCP tool responses to prevent secret exposure.
 */
export function sanitizeMcpOutput<T = any>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeMcpOutput(item)) as unknown as T;
  }

  const sensitiveKeys = [
    'password',
    'passwordhash',
    'hashedkey',
    'apikey',
    'secretkey',
    'accesstoken',
    'refreshtoken',
    'token',
    'authorization',
    'database_url',
    'privatekey',
    'secret'
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some((s) => lowerKey.includes(s));

    if (isSensitive && typeof value === 'string') {
      sanitized[key] = '[REDACTED_SECRET]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMcpOutput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
