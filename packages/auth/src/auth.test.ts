import { describe, it, expect } from 'vitest';
import { AccessControl } from './rbac.js';
import { TokenService } from './tokens.js';
import { ApiKeyService } from './api-keys.js';
import { Role } from '@novaqa/types';

describe('Auth Package', () => {
  describe('RBAC AccessControl', () => {
    it('should grant OWNER full permissions', () => {
      expect(AccessControl.hasPermission(Role.OWNER, 'project:create')).toBe(true);
      expect(AccessControl.hasPermission(Role.OWNER, 'org:delete')).toBe(true);
      expect(AccessControl.hasPermission(Role.OWNER, 'test_run:create')).toBe(true);
    });

    it('should grant ENGINEER test execution but restrict org deletion', () => {
      expect(AccessControl.hasPermission(Role.ENGINEER, 'test_run:create')).toBe(true);
      expect(AccessControl.hasPermission(Role.ENGINEER, 'finding:resolve')).toBe(true);
      expect(AccessControl.hasPermission(Role.ENGINEER, 'org:delete')).toBe(false);
    });

    it('should restrict VIEWER to read-only actions', () => {
      expect(AccessControl.hasPermission(Role.VIEWER, 'project:read')).toBe(true);
      expect(AccessControl.hasPermission(Role.VIEWER, 'project:create')).toBe(false);
      expect(AccessControl.hasPermission(Role.VIEWER, 'test_run:create')).toBe(false);
    });
  });

  describe('TokenService', () => {
    it('should sign and verify JWT tokens correctly', () => {
      const payload = {
        userId: 'usr-123',
        email: 'dev@novaqa.dev',
        organizationId: 'org-456',
        role: Role.ADMIN
      };

      const token = TokenService.signToken(payload);
      expect(token).toBeDefined();

      const decoded = TokenService.verifyToken(token);
      expect(decoded.userId).toBe('usr-123');
      expect(decoded.email).toBe('dev@novaqa.dev');
      expect(decoded.role).toBe(Role.ADMIN);
    });

    it('should hash and compare passwords accurately', async () => {
      const plain = 'SuperSecurePass123!';
      const hash = await TokenService.hashPassword(plain);

      expect(hash).not.toBe(plain);
      const isMatch = await TokenService.comparePassword(plain, hash);
      expect(isMatch).toBe(true);

      const isMismatch = await TokenService.comparePassword('WrongPassword', hash);
      expect(isMismatch).toBe(false);
    });
  });

  describe('ApiKeyService', () => {
    it('should generate valid prefixed API keys and verify cryptographic hash', () => {
      const { rawKey, keyPrefix, hashedKey } = ApiKeyService.generateApiKey('nqa_live_');

      expect(rawKey.startsWith('nqa_live_')).toBe(true);
      expect(keyPrefix).toBe(rawKey.substring(0, 12));
      expect(hashedKey).toBeDefined();

      const isValid = ApiKeyService.verifyApiKey(rawKey, hashedKey);
      expect(isValid).toBe(true);

      const isInvalid = ApiKeyService.verifyApiKey('nqa_live_tamperedkey', hashedKey);
      expect(isInvalid).toBe(false);
    });
  });
});
