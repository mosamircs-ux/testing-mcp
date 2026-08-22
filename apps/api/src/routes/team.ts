import { Router } from 'express';
import { prisma } from '@novaqa/database';
import { TokenService } from '@novaqa/auth';
import { InviteMemberSchema, UpdateMemberRoleSchema, Role } from '@novaqa/types';
import { NotFoundError, BadRequestError, ForbiddenError } from '@novaqa/shared';
import { authMiddleware, requirePermission } from '../middleware/auth';
import { z } from 'zod';

export const teamRouter = Router();

// Apply auth middleware to all team endpoints
teamRouter.use(authMiddleware);

// 1. List Organization Members (requires org.read)
teamRouter.get('/api/v1/team/members', requirePermission('org.read'), async (req, res, next) => {
  try {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: req.auth!.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            isEmailVerified: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        isEmailVerified: m.user.isEmailVerified,
        joinedAt: m.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
});

// 2. Invite / Add Member (requires team.manage)
teamRouter.post('/api/v1/team/invite', requirePermission('team.manage'), async (req, res, next) => {
  try {
    const input = InviteMemberSchema.parse(req.body);

    let user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    // If user doesn't exist, create an invited placeholder user
    if (!user) {
      const tempHash = await TokenService.hashPassword(TokenService.generateRefreshToken());
      user = await prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.email.split('@')[0],
          passwordHash: tempHash,
          isEmailVerified: false
        }
      });
    }

    // Check if already member of current organization
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: req.auth!.organizationId,
          userId: user.id
        }
      }
    });

    if (existingMembership) {
      throw new BadRequestError('User is already a member of this organization');
    }

    const membership = await prisma.organizationMember.create({
      data: {
        organizationId: req.auth!.organizationId,
        userId: user.id,
        role: input.role
      },
      include: {
        user: true
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: membership.id,
        userId: membership.userId,
        name: membership.user.name,
        email: membership.user.email,
        role: membership.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// 3. Update Member Role (requires team.manage)
teamRouter.patch('/api/v1/team/members/:id/role', requirePermission('team.manage'), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { role } = UpdateMemberRoleSchema.parse(req.body);

    const targetMember = await prisma.organizationMember.findFirst({
      where: { id, organizationId: req.auth!.organizationId }
    });

    if (!targetMember) {
      throw new NotFoundError('Organization member', id);
    }

    // Safety: Prevent demoting the last OWNER
    if (targetMember.role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await prisma.organizationMember.count({
        where: { organizationId: req.auth!.organizationId, role: 'OWNER' }
      });
      if (ownerCount <= 1) {
        throw new BadRequestError('Cannot change role: Organization must have at least one Owner');
      }
    }

    const updated = await prisma.organizationMember.update({
      where: { id },
      data: { role },
      include: { user: true }
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.role
      }
    });
  } catch (err) {
    next(err);
  }
});

// 4. Remove Member (requires team.manage)
teamRouter.delete('/api/v1/team/members/:id', requirePermission('team.manage'), async (req, res, next) => {
  try {
    const id = String(req.params.id);

    const targetMember = await prisma.organizationMember.findFirst({
      where: { id, organizationId: req.auth!.organizationId }
    });

    if (!targetMember) {
      throw new NotFoundError('Organization member', id);
    }

    // Prevent removing last OWNER
    if (targetMember.role === 'OWNER') {
      const ownerCount = await prisma.organizationMember.count({
        where: { organizationId: req.auth!.organizationId, role: 'OWNER' }
      });
      if (ownerCount <= 1) {
        throw new BadRequestError('Cannot remove member: Organization must have at least one Owner');
      }
    }

    await prisma.organizationMember.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Member removed from organization'
    });
  } catch (err) {
    next(err);
  }
});

// 5. List and Create Sub-Teams
teamRouter.get('/api/v1/team/teams', requirePermission('org.read'), async (req, res, next) => {
  try {
    const teams = await prisma.team.findMany({
      where: { organizationId: req.auth!.organizationId },
      include: {
        members: { include: { user: true } },
        _count: { select: { projects: true } }
      }
    });

    res.json({
      success: true,
      data: teams.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        memberCount: t.members.length,
        projectCount: t._count.projects,
        members: t.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.role
        }))
      }))
    });
  } catch (err) {
    next(err);
  }
});

const CreateTeamSchema = z.object({
  name: z.string().min(2).max(50)
});

teamRouter.post('/api/v1/team/teams', requirePermission('team.manage'), async (req, res, next) => {
  try {
    const { name } = CreateTeamSchema.parse(req.body);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const team = await prisma.team.create({
      data: {
        organizationId: req.auth!.organizationId,
        name,
        slug: `${slug}-${Date.now().toString(36)}`
      }
    });

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (err) {
    next(err);
  }
});
