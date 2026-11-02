import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'

export async function listTransactions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
    const environment = req.query.environment as string | undefined

    const where = environment ? { environment: environment as any } : {}

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { simulation: { select: { description: true, createdById: true } } },
      }),
      prisma.transaction.count({ where }),
    ])

    ok(res, { items, total, page, limit })
  } catch {
    serverError(res)
  }
}

export async function listLedgerEntries(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))

    const [items, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { ledgerAccount: { include: { virtualWallet: { select: { label: true, userId: true } } } } },
      }),
      prisma.ledgerEntry.count(),
    ])

    ok(res, { items, total, page, limit })
  } catch {
    serverError(res)
  }
}
