import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'

export async function listAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
    const actorId = req.query.actorId as string | undefined
    const action = req.query.action as string | undefined

    const where: Record<string, unknown> = {}
    if (actorId) where.actorId = actorId
    if (action) where.action = { contains: action, mode: 'insensitive' }

    const [items, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { email: true, firstName: true, lastName: true } } },
      }),
      prisma.adminLog.count({ where }),
    ])

    ok(res, { items, total, page, limit })
  } catch {
    serverError(res)
  }
}
