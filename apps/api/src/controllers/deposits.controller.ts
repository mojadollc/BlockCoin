import { Response } from 'express'
import { prisma } from '../utils/prisma'
import { ok, created, badRequest, notFound, forbidden, serverError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'

// Your master deposit addresses — set these in .env
const DEPOSIT_ADDRESSES = {
  ETH_ERC20: process.env.DEPOSIT_ETH_ADDRESS ?? '',
  TRON_TRC20: process.env.DEPOSIT_TRON_ADDRESS ?? '',
}

export async function getDepositAddresses(_req: AuthRequest, res: Response): Promise<void> {
  ok(res, DEPOSIT_ADDRESSES)
}

export async function submitDeposit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { walletId, network, txHash, amountDisplay } = req.body
    const userId = req.user!.sub

    if (!['ETH_ERC20', 'TRON_TRC20'].includes(network)) {
      badRequest(res, 'Invalid network'); return
    }

    const wallet = await prisma.virtualWallet.findUnique({ where: { id: walletId } })
    if (!wallet) { notFound(res, 'Wallet not found'); return }
    if (wallet.userId !== userId) { forbidden(res); return }
    if (wallet.status !== 'ACTIVE') { badRequest(res, 'Wallet is not active'); return }

    const existing = await prisma.depositRequest.findUnique({ where: { txHash } })
    if (existing) { badRequest(res, 'Transaction hash already submitted'); return }

    const deposit = await prisma.depositRequest.create({
      data: { userId, walletId, network, txHash: txHash.trim(), amountDisplay },
    })

    ok(res, deposit)
  } catch {
    serverError(res)
  }
}

export async function listMyDeposits(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))

    const [items, total] = await Promise.all([
      prisma.depositRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { wallet: { select: { label: true } } },
      }),
      prisma.depositRequest.count({ where: { userId } }),
    ])

    ok(res, { items, total, page, limit })
  } catch {
    serverError(res)
  }
}
