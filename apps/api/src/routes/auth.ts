import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { TokenService } from '@novaqa/auth';
import { z } from 'zod';
import { UnauthorizedError } from '@novaqa/shared';

export const authRouter = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

// Login endpoint
authRouter.post('/api/v1/auth/login', async (req, res, next) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
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
    const role = primaryMembership ? primaryMembership.role : ('ENGINEER' as any);

    const token = TokenService.signToken({
      userId: user.id,
      email: user.email,
      organizationId,
      role
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl
        },
        organization: primaryMembership?.organization
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get Current User Profile
authRouter.get('/api/v1/auth/me', async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new UnauthorizedError();
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      include: {
        memberships: { include: { organization: true } }
      }
    });

    if (!user) throw new UnauthorizedError('User not found');

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl
        },
        role: req.auth.role,
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
