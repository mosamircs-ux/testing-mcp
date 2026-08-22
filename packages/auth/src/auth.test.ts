import { describe, it, expect } from 'vitest';
import { AccessControl, can } from './rbac';
import { TokenService } from './tokens';
import { ApiKeyService } from './api-keys';
import { Role } from '@novaqa/types';

describe('Auth Package', () => {
  describe('RBAC AccessControl', () => {
    it('should grant OWNER full permissions', () => {
      expect(AccessControl.hasPermission(Role.OWNER, 'project.create')).toBe(true);
      expect(AccessControl.hasPermission(Role.OWNER, 'org.delete')).toBe(true);
      expect(AccessControl.hasPermission(Role.OWNER, 'run.execute')).toBe(true);
    });

    it('should grant QA_ENGINEER test execution but restrict org deletion', () => {
      expect(AccessControl.hasPermission(Role.QA_ENGINEER, 'run.execute')).toBe(true);
      expect(AccessControl.hasPermission(Role.QA_ENGINEER, 'finding.update')).toBe(true);
      expect(AccessControl.hasPermission(Role.QA_ENGINEER, 'org.delete')).toBe(false);
    });

    it('should restrict VIEWER to read-only actions', () => {
      expect(AccessControl.hasPermission(Role.VIEWER, 'project.read')).toBe(true);
      expect(AccessControl.hasPermission(Role.VIEWER, 'project.create')).toBe(false);
      expect(AccessControl.hasPermission(Role.VIEWER, 'run.execute')).toBe(false);
    });
  });

  describe('TokenService', () => {
    it('should hash and compare passwords accurately', async () => {
      const password = 'SecretPassword123!';
      const hash = await TokenService.hashPassword(password);
      expect(hash).not.toBe(password);

      const isValid = await TokenService.comparePassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await TokenService.comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('ApiKeyService', () => {
    it('should generate valid API keys and verify them', () => {
      const key = ApiKeyService.generateApiKey();
      expect(key.rawKey.startsWith('nqa_live_')).toBe(true);
      expect(key.keyPrefix.length).toBe(12);

      const verified = ApiKeyService.verifyApiKey(key.rawKey, key.hashedKey);
      expect(verified).toBe(true);
    });
  });
});
