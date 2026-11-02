import { Response } from 'express'
import { prisma } from '../utils/prisma'
import { ok, notFound, forbidden, serverError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import { unitsToDisplay } from '@blockcoin/shared'

export async function listTransactions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))

    // Get all wallet IDs belonging to this user
    const wallets = await prisma.virtualWallet.findMany({
      where: { userId },
      select: { id: true },
    })
    const walletIds = wallets.map(w => w.id)

    const where = {
      OR: [
        { fromWalletId: { in: walletIds } },
        { toWalletId: { in: walletIds } },
      ],
    }

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          simulation: { select: { description: true, type: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    const mapped = items.map(t => ({
      ...t,
      amountDisplay: unitsToDisplay(t.amountUnits),
    }))

    ok(res, { items: mapped, total, page, limit })
  } catch {
    serverError(res)
  }
}

export async function getTransaction(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub
    const tx = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        simulation: {
          include: { events: { orderBy: { createdAt: 'asc' } } },
        },
      },
    })

    if (!tx) { notFound(res); return }

    // Verify ownership — user must own at least one of the wallets
    const wallets = await prisma.virtualWallet.findMany({
      where: { userId },
      select: { id: true },
    })
    const walletIds = new Set(wallets.map(w => w.id))
    const owns = (tx.fromWalletId && walletIds.has(tx.fromWalletId)) ||
                 (tx.toWalletId && walletIds.has(tx.toWalletId))

    if (!owns) { forbidden(res); return }

    ok(res, { ...tx, amountDisplay: unitsToDisplay(tx.amountUnits) })
  } catch {
    serverError(res)
  }
}
