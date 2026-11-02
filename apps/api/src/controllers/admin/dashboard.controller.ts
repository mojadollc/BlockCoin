import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'

export async function getDashboard(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [totalUsers, activeUsers, totalWallets, totalSimulations, recentLogs, simsByStatus] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.virtualWallet.count(),
        prisma.simulation.count(),
        prisma.adminLog.findMany({
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
    })
  } catch {
    serverError(res)
  }
}
