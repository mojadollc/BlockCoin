import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, badRequest, notFound, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'
import { displayToUnits, unitsToDisplay } from '@blockcoin/shared'
import { v4 as uuidv4 } from 'uuid'

export async function listWallets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
    const userId = req.query.userId as string | undefined

    const where = userId ? { userId } : {}

    const [items, total] = await Promise.all([
      prisma.virtualWallet.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          ledgerAccount: { select: { balanceUnits: true } },
        },
      }),
      prisma.virtualWallet.count({ where }),
    ])

    ok(res, { items, total, page, limit })
  } catch {
    serverError(res)
  }
}

export async function adjustBalance(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { amountDisplay, type, description } = req.body
    const walletId = req.params.id

    const wallet = await prisma.virtualWallet.findUnique({
      where: { id: walletId },
      include: { ledgerAccount: true },
    })
    if (!wallet) { notFound(res, 'Wallet not found'); return }
    if (wallet.status !== 'ACTIVE') { badRequest(res, 'Wallet is not active'); return }

    const amountUnits = displayToUnits(amountDisplay)
    if (amountUnits <= 0n) { badRequest(res, 'Amount must be positive'); return }

    const idempotencyKey = `adj:${uuidv4()}`

    const result = await prisma.$transaction(async (tx) => {
      let account = wallet.ledgerAccount
      if (!account) {
        account = await tx.ledgerAccount.create({ data: { virtualWalletId: walletId } })
      }

      const newBalance =
        type === 'CREDIT' || type === 'ADJUSTMENT'
          ? account.balanceUnits + amountUnits
          : account.balanceUnits - amountUnits

      if (newBalance < 0n) throw new Error('Insufficient balance')

      const updated = await tx.ledgerAccount.update({
        where: { id: account.id },
        data: { balanceUnits: newBalance },
      })

      const entry = await tx.ledgerEntry.create({
        data: {
          ledgerAccountId: account.id,
          type,
          amountUnits,
          balanceAfter: newBalance,
          description,
          idempotencyKey,
          actorId: req.user!.sub,
        },
      })

      return { balanceUnits: updated.balanceUnits, entry }
    })

    await prisma.adminLog.create({
      data: {
        actorId: req.user!.sub,
        action: 'ADJUST_BALANCE',
        targetType: 'VirtualWallet',
        targetId: walletId,
        metadata: { amountDisplay, type, description },
      },
    })

    ok(res, {
      balanceDisplay: unitsToDisplay(result.balanceUnits),
      entryId: result.entry.id,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Adjustment failed'
    badRequest(res, msg)
  }
}

export async function suspendWallet(req: AuthRequest, res: Response): Promise<void> {
  try {
    const wallet = await prisma.virtualWallet.update({
      where: { id: req.params.id },
      data: { status: 'SUSPENDED' },
    })
    await prisma.adminLog.create({
      data: { actorId: req.user!.sub, action: 'SUSPEND_WALLET', targetType: 'VirtualWallet', targetId: wallet.id },
    })
    ok(res, wallet)
  } catch {
    serverError(res)
  }
}

export async function activateWallet(req: AuthRequest, res: Response): Promise<void> {
  try {
    const wallet = await prisma.virtualWallet.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    })
    await prisma.adminLog.create({
      data: { actorId: req.user!.sub, action: 'ACTIVATE_WALLET', targetType: 'VirtualWallet', targetId: wallet.id },
    })
    ok(res, wallet)
  } catch {
    serverError(res)
  }
}
