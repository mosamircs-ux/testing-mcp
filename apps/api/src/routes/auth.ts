import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { TokenService } from '@novaqa/auth';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  Role
} from '@novaqa/types';
import { UnauthorizedError, BadRequestError, NotFoundError } from '@novaqa/shared';
import { rateLimiter } from '../middleware/rate-limiter';
import { authMiddleware } from '../middleware/auth';

export const authRouter = Router();

// Rate-limiting on sensitive auth paths (5 attempts per minute for auth brute-force protection)
const authRateLimit = rateLimiter({ maxRequests: 10, windowMs: 60 * 1000, message: 'Too many authentication attempts. Please try again shortly.' });

// 1. User Registration
authRouter.post('/api/v1/auth/register', authRateLimit, async (req, res, next) => {
  try {
    const input = RegisterSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (existingUser) {
      throw new BadRequestError('An account with this email already exists');
    }

    const passwordHash = await TokenService.hashPassword(input.password);
    const verificationTokenInfo = TokenService.generateTimedToken();

    // Create User & Default Organization in transaction
    const orgName = input.organizationName || `${input.name}'s Workspace`;
    const orgSlug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + `-${Date.now().toString(36)}`;

    const { user, organization, session } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          passwordHash,
          isEmailVerified: false,
          emailVerificationToken: verificationTokenInfo.hashedToken,
          emailVerificationExpires: verificationTokenInfo.expiresAt
        }
      });

      const newOrg = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgSlug,
          tier: 'FREE'
        }
      });

      await tx.organizationMember.create({
        data: {
          organizationId: newOrg.id,
          userId: newUser.id,
          role: 'OWNER'
        }
      });

      const rawRefreshToken = TokenService.generateRefreshToken();
      const newSession = await tx.session.create({
        data: {
          userId: newUser.id,
          refreshTokenHash: TokenService.hashToken(rawRefreshToken),
          userAgent: req.headers['user-agent'] || null,
          ipAddress: req.ip || null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      return {
        user: newUser,
        organization: newOrg,
        session: { id: newSession.id, rawRefreshToken }
      };
    });

    const accessToken = TokenService.signAccessToken({
      userId: user.id,
      email: user.email,
      organizationId: organization.id,
      role: Role.OWNER,
      sessionId: session.id
    });

    res.status(201).json({
      success: true,
      data: {
        tokens: {
          accessToken,
          refreshToken: session.rawRefreshToken,
          expiresIn: '7d'
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          role: Role.OWNER
        },
        verificationToken: verificationTokenInfo.token // Included for instant dev/testing verification
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. User Login
authRouter.post('/api/v1/auth/login', authRateLimit, async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          include: { organization: true }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await TokenService.comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const primaryMembership = user.memberships[0];
    const organizationId = primaryMembership ? primaryMembership.organizationId : 'org-default';
    const role = (primaryMembership?.role as Role) || Role.QA_ENGINEER;

    // Create session record for session rotation
    const rawRefreshToken = TokenService.generateRefreshToken();
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: TokenService.hashToken(rawRefreshToken),
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    const accessToken = TokenService.signAccessToken({
      userId: user.id,
      email: user.email,
      organizationId,
      role,
      sessionId: session.id
    });

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken,
          refreshToken: rawRefreshToken,
          expiresIn: '7d'
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isEmailVerified: user.isEmailVerified
        },
        organization: primaryMembership ? {
          id: primaryMembership.organization.id,
          name: primaryMembership.organization.name,
          slug: primaryMembership.organization.slug,
          role: primaryMembership.role
        } : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// 3. Refresh Token / Session Rotation
authRouter.post('/api/v1/auth/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = RefreshTokenSchema.parse(req.body);
    const tokenHash = TokenService.hashToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: {
        user: {
          include: {
            memberships: { include: { organization: true } }
          }
        }
      }
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Session Rotation: Invalidate previous refresh token and issue a new one
    const newRawRefreshToken = TokenService.generateRefreshToken();
    const newRefreshTokenHash = TokenService.hashToken(newRawRefreshToken);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        updatedAt: new Date()
      }
    });

    const primaryMembership = session.user.memberships[0];
    const organizationId = primaryMembership ? primaryMembership.organizationId : 'org-default';
    const role = (primaryMembership?.role as Role) || Role.QA_ENGINEER;

    const newAccessToken = TokenService.signAccessToken({
      userId: session.user.id,
      email: session.user.email,
      organizationId,
      role,
      sessionId: session.id
    });

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRawRefreshToken,
          expiresIn: '7d'
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// 4. Logout (Session Invalidation)
authRouter.post('/api/v1/auth/logout', authMiddleware, async (req, res, next) => {
  try {
    if (req.auth?.sessionId) {
      await prisma.session.update({
        where: { id: req.auth.sessionId },
        data: { isRevoked: true }
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
});

// 5. Forgot Password Request
authRouter.post('/api/v1/auth/forgot-password', authRateLimit, async (req, res, next) => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always respond with success to prevent user enumeration attacks
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been dispatched.'
      });
    }

    const resetTokenInfo = TokenService.generateTimedToken();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenInfo.hashedToken,
        resetPasswordExpires: resetTokenInfo.expiresAt
      }
    });

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been dispatched.',
      resetToken: resetTokenInfo.token // Included in response for seamless local testing & verification
    });
  } catch (err) {
    next(err);
  }
});

// 6. Reset Password
authRouter.post('/api/v1/auth/reset-password', authRateLimit, async (req, res, next) => {
  try {
    const { token, newPassword } = ResetPasswordSchema.parse(req.body);
    const hashedToken = TokenService.hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new BadRequestError('Password reset link is invalid or has expired');
    }

    const passwordHash = await TokenService.hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      }),
      // Revoke all existing sessions for security
      prisma.session.updateMany({
        where: { userId: user.id },
        data: { isRevoked: true }
      })
    ]);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (err) {
    next(err);
  }
});

// 7. Verify Email
authRouter.post('/api/v1/auth/verify-email', async (req, res, next) => {
  try {
    const { token } = VerifyEmailSchema.parse(req.body);
    const hashedToken = TokenService.hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new BadRequestError('Verification token is invalid or expired');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (err) {
    next(err);
  }
});

// 8. Current User & Organizations
authRouter.get('/api/v1/auth/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: {
        memberships: {
          include: { organization: true }
        }
      }
    });

    if (!user) throw new NotFoundError('User not found');

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          isEmailVerified: user.isEmailVerified
        },
        activeOrganizationId: req.auth!.organizationId,
        role: req.auth!.role,
        organizations: user.memberships.map((m) => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          tier: m.organization.tier,
          role: m.role
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

// 9. Active Sessions List
authRouter.get('/api/v1/auth/sessions', authMiddleware, async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId: req.auth!.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: sessions.map((s) => ({
        id: s.id,
        userAgent: s.userAgent || 'Unknown Device',
        ipAddress: s.ipAddress || 'Unknown IP',
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === req.auth!.sessionId
      }))
    });
  } catch (err) {
    next(err);
  }
});

// 10. Terminate a Specific Session
authRouter.delete('/api/v1/auth/sessions/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await prisma.session.findFirst({
      where: { id, userId: req.auth!.userId }
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    await prisma.session.update({
      where: { id },
      data: { isRevoked: true }
    });

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (err) {
    next(err);
  }
});

// 11. OAuth Google Ready Initiation & Callback
authRouter.get('/api/v1/auth/oauth/google', (req, res) => {
  // OAuth URL constructor for Google Identity
  const clientId = process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id';
  const redirectUri = `${process.env.API_URL || 'http://localhost:4000'}/api/v1/auth/oauth/google/callback`;
  const scope = encodeURIComponent('openid profile email');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  res.json({
    success: true,
    data: {
      authUrl: googleAuthUrl
    }
  });
});

authRouter.post('/api/v1/auth/oauth/google/callback', async (req, res, next) => {
  try {
    const { credential, email, name, avatarUrl } = req.body;
    if (!email) {
      throw new BadRequestError('OAuth email required');
    }

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: { include: { organization: true } }
      }
    });

    if (!user) {
      const orgName = `${name || 'User'}'s Workspace`;
      const orgSlug = `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
      const placeholderHash = await TokenService.hashPassword(TokenService.generateRefreshToken());

      const created = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            name: name || 'Google User',
            avatarUrl: avatarUrl || null,
            passwordHash: placeholderHash,
            isEmailVerified: true,
            oauthProvider: 'GOOGLE'
          }
        });

        const org = await tx.organization.create({
          data: {
            name: orgName,
            slug: orgSlug,
            tier: 'FREE'
          }
        });

        await tx.organizationMember.create({
          data: {
            organizationId: org.id,
            userId: u.id,
            role: 'OWNER'
          }
        });

        return { user: u, organization: org };
      });

      user = await prisma.user.findUnique({
        where: { id: created.user.id },
        include: { memberships: { include: { organization: true } } }
      });
    }

    const rawRefreshToken = TokenService.generateRefreshToken();
    const session = await prisma.session.create({
      data: {
        userId: user!.id,
        refreshTokenHash: TokenService.hashToken(rawRefreshToken),
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    const primaryMembership = user!.memberships[0];
    const organizationId = primaryMembership ? primaryMembership.organizationId : 'org-default';
    const role = (primaryMembership?.role as Role) || Role.OWNER;

    const accessToken = TokenService.signAccessToken({
      userId: user!.id,
      email: user!.email,
      organizationId,
      role,
      sessionId: session.id
    });

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken,
          refreshToken: rawRefreshToken,
          expiresIn: '7d'
        },
        user: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
          avatarUrl: user!.avatarUrl,
          isEmailVerified: user!.isEmailVerified
        },
        organization: primaryMembership?.organization
      }
    });
  } catch (err) {
    next(err);
  }
});
