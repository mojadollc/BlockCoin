import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'

export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const isSubAdmin = req.user!.role === 'SUB_ADMIN'
    const actorId = req.user!.sub

    // SUB_ADMIN only sees their own activity log, not platform-wide stats
    const logWhere = isSubAdmin ? { actorId } : {}

    const [totalUsers, activeUsers, totalWallets, totalSimulations, recentLogs, simsByStatus] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.virtualWallet.count(),
        prisma.simulation.count(),
        prisma.adminLog.findMany({
          where: logWhere,
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { firstName: true, lastName: true, email: true } } },
        }),
        prisma.simulation.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
      ])

    ok(res, {
      stats: { totalUsers, activeUsers, totalWallets, totalSimulations },
      recentLogs,
      simsByStatus,
      isSubAdmin,
    })
  } catch {
    serverError(res)
  }
}
