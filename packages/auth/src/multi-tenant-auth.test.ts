import { describe, it, expect } from 'vitest';
import { can, AccessControl } from './rbac';
import { TokenService } from './tokens';
import { ApiKeyService } from './api-keys';
import { Role } from '@novaqa/types';

describe('Multi-Tenant SaaS Auth & RBAC Permissions', () => {
  describe('RBAC Permission Matrix (6 Roles)', () => {
    it('should grant OWNER all system permissions', () => {
      expect(can(Role.OWNER, 'org.read')).toBe(true);
      expect(can(Role.OWNER, 'org.update')).toBe(true);
      expect(can(Role.OWNER, 'org.delete')).toBe(true);
      expect(can(Role.OWNER, 'team.manage')).toBe(true);
      expect(can(Role.OWNER, 'project.create')).toBe(true);
      expect(can(Role.OWNER, 'project.delete')).toBe(true);
      expect(can(Role.OWNER, 'test.execute')).toBe(true);
      expect(can(Role.OWNER, 'billing.manage')).toBe(true);
      expect(can(Role.OWNER, 'api_key.create')).toBe(true);
      expect(can(Role.OWNER, 'ai.trigger')).toBe(true);
    });

    it('should grant ADMIN permissions except org deletion', () => {
      expect(can(Role.ADMIN, 'project.create')).toBe(true);
      expect(can(Role.ADMIN, 'team.manage')).toBe(true);
      expect(can(Role.ADMIN, 'billing.read')).toBe(true);
      expect(can(Role.ADMIN, 'billing.manage')).toBe(false);
      expect(can(Role.ADMIN, 'org.delete')).toBe(false);
    });

    it('should grant QA_ENGINEER execution and triage permissions but not team or billing management', () => {
      expect(can(Role.QA_ENGINEER, 'project.read')).toBe(true);
      expect(can(Role.QA_ENGINEER, 'project.create')).toBe(true);
      expect(can(Role.QA_ENGINEER, 'test.execute')).toBe(true);
      expect(can(Role.QA_ENGINEER, 'finding.update')).toBe(true);
      expect(can(Role.QA_ENGINEER, 'team.manage')).toBe(false);
      expect(can(Role.QA_ENGINEER, 'billing.read')).toBe(false);
      expect(can(Role.QA_ENGINEER, 'org.delete')).toBe(false);
    });

    it('should grant DEVELOPER test creation and execution permissions but not test deletion or team management', () => {
      expect(can(Role.DEVELOPER, 'project.read')).toBe(true);
      expect(can(Role.DEVELOPER, 'test.create')).toBe(true);
      expect(can(Role.DEVELOPER, 'test.execute')).toBe(true);
      expect(can(Role.DEVELOPER, 'test.delete')).toBe(false);
      expect(can(Role.DEVELOPER, 'team.manage')).toBe(false);
      expect(can(Role.DEVELOPER, 'billing.manage')).toBe(false);
    });

    it('should restrict VIEWER to read-only actions', () => {
      expect(can(Role.VIEWER, 'org.read')).toBe(true);
      expect(can(Role.VIEWER, 'project.read')).toBe(true);
      expect(can(Role.VIEWER, 'finding.read')).toBe(true);
      expect(can(Role.VIEWER, 'project.create')).toBe(false);
      expect(can(Role.VIEWER, 'project.delete')).toBe(false);
      expect(can(Role.VIEWER, 'test.execute')).toBe(false);
      expect(can(Role.VIEWER, 'api_key.create')).toBe(false);
    });

    it('should restrict BILLING_MANAGER to billing actions only', () => {
      expect(can(Role.BILLING_MANAGER, 'billing.read')).toBe(true);
      expect(can(Role.BILLING_MANAGER, 'billing.manage')).toBe(true);
      expect(can(Role.BILLING_MANAGER, 'project.create')).toBe(false);
      expect(can(Role.BILLING_MANAGER, 'test.execute')).toBe(false);
      expect(can(Role.BILLING_MANAGER, 'team.manage')).toBe(false);
    });
  });

  describe('Tokens and Security Services', () => {
    it('should sign and verify access tokens with tenant payload', () => {
      const payload = {
        userId: 'usr-123',
        email: 'dev@acme.com',
        organizationId: 'org-acme',
        role: Role.DEVELOPER,
        sessionId: 'sess-456'
      };

      const token = TokenService.signAccessToken(payload);
      const verified = TokenService.verifyAccessToken(token);

      expect(verified.userId).toBe(payload.userId);
      expect(verified.organizationId).toBe(payload.organizationId);
      expect(verified.role).toBe(Role.DEVELOPER);
      expect(verified.sessionId).toBe('sess-456');
    });

    it('should generate secure refresh tokens and hash them deterministically', () => {
      const rawToken = TokenService.generateRefreshToken();
      expect(rawToken.startsWith('nqa_rf_')).toBe(true);

      const hash1 = TokenService.hashToken(rawToken);
      const hash2 = TokenService.hashToken(rawToken);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex
    });

    it('should generate timed tokens for email verification / password reset', () => {
      const timed = TokenService.generateTimedToken();
      expect(timed.token).toBeDefined();
      expect(timed.hashedToken).toBeDefined();
      expect(timed.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should generate and verify API keys securely', () => {
      const { rawKey, keyPrefix, hashedKey } = ApiKeyService.generateApiKey();
      expect(rawKey.startsWith('nqa_live_')).toBe(true);
      expect(keyPrefix.length).toBe(12);

      const isValid = ApiKeyService.verifyApiKey(rawKey, hashedKey);
      expect(isValid).toBe(true);

      const isInvalid = ApiKeyService.verifyApiKey('nqa_live_wrong_secret', hashedKey);
      expect(isInvalid).toBe(false);
    });
  });
});
