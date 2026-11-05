import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, badRequest, notFound, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'
import { PERMISSION_FEATURES, PermissionFeature } from '@blockcoin/shared'

export async function getSubAdminPermissions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true, subAdminPermissions: true },
    })
    if (!user) { notFound(res); return }
    if (user.role !== 'SUB_ADMIN') { badRequest(res, 'User is not a SUB_ADMIN'); return }
    ok(res, user.subAdminPermissions)
  } catch {
    serverError(res)
  }
}

export async function setSubAdminPermissions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { permissions } = req.body as {
      permissions: Array<{ feature: PermissionFeature; level: 'READ' | 'WRITE' }>
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) { notFound(res); return }
    if (user.role !== 'SUB_ADMIN') { badRequest(res, 'User is not a SUB_ADMIN'); return }

    // Validate features
    for (const p of permissions) {
      if (!PERMISSION_FEATURES.includes(p.feature)) {
        badRequest(res, `Invalid feature: ${p.feature}`); return
      }
    }

    // Delete all existing, then upsert new ones
    await prisma.subAdminPermission.deleteMany({ where: { userId: req.params.id } })

    if (permissions.length > 0) {
      await prisma.subAdminPermission.createMany({
        data: permissions.map(p => ({
          userId: req.params.id,
          feature: p.feature,
          level: p.level,
        })),
      })
    }

    await prisma.adminLog.create({
      data: {
        actorId: req.user!.sub,
        action: 'SET_SUB_ADMIN_PERMISSIONS',
        targetType: 'User',
        targetId: req.params.id,
        metadata: { permissions },
      },
    })

    const updated = await prisma.subAdminPermission.findMany({ where: { userId: req.params.id } })
    ok(res, updated)
  } catch {
    serverError(res)
  }
}
