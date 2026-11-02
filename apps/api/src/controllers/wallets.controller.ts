import { Response } from 'express'
import { prisma } from '../utils/prisma'
import { ok, created, badRequest, notFound, forbidden, serverError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import { unitsToDisplay, displayToUnits } from '@blockcoin/shared'
import { ensureLedgerAccount, ledgerCreditDebit, ledgerTransfer } from '../services/ledger.service'
import { io } from '../index'
import { v4 as uuidv4 } from 'uuid'

export async function listWallets(req: AuthRequest, res: Response): Promise<void> {
  try {
    const wallets = await prisma.virtualWallet.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'asc' },
      include: { ledgerAccount: { select: { balanceUnits: true } } },
    })

    const result = wallets.map(({ ledgerAccount, ...w }) => ({
      ...w,
      balanceDisplay: ledgerAccount
        ? unitsToDisplay(ledgerAccount.balanceUnits)
        : '0.000000',
    }))

    ok(res, result)
  } catch {
    serverError(res)
  }
}

export async function createWallet(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { label } = req.body
    const userId = req.user!.sub

    const count = await prisma.virtualWallet.count({ where: { userId } })
    if (count >= 10) { badRequest(res, 'Maximum 10 wallets per user'); return }

    const wallet = await prisma.$transaction(async (tx) => {
      const w = await tx.virtualWallet.create({
        data: { userId, label },
      })
      await tx.ledgerAccount.create({ data: { virtualWalletId: w.id } })
      return w
    })

    created(res, { ...wallet, balanceDisplay: '0.000000' })
  } catch {
    serverError(res)
  }
}

export async function getWallet(req: AuthRequest, res: Response): Promise<void> {
  try {
    const wallet = await prisma.virtualWallet.findUnique({
      where: { id: req.params.id },
      include: { ledgerAccount: { select: { balanceUnits: true } } },
    })

    if (!wallet) { notFound(res); return }
    if (wallet.userId !== req.user!.sub) { forbidden(res); return }

    ok(res, {
      ...wallet,
      ledgerAccount: undefined,
      balanceDisplay: wallet.ledgerAccount
        ? unitsToDisplay(wallet.ledgerAccount.balanceUnits)
        : '0.000000',
    })
  } catch {
    serverError(res)
  }
}

export async function getBalance(req: AuthRequest, res: Response): Promise<void> {
  try {
    const wallet = await prisma.virtualWallet.findUnique({
      where: { id: req.params.id },
      include: { ledgerAccount: { select: { balanceUnits: true } } },
    })

    if (!wallet) { notFound(res); return }
    if (wallet.userId !== req.user!.sub) { forbidden(res); return }

    const balanceUnits = wallet.ledgerAccount?.balanceUnits ?? 0n
    ok(res, {
      walletId: wallet.id,
      label: wallet.label,
      balanceDisplay: unitsToDisplay(balanceUnits),
      environment: 'INTERNAL',
      note: 'BlockCoin virtual balance — not real USDT',
    })
  } catch {
    serverError(res)
  }
}

export async function deposit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { amountDisplay, description } = req.body
    const walletId = req.params.id

    const wallet = await prisma.virtualWallet.findUnique({ where: { id: walletId } })
    if (!wallet) { notFound(res); return }
    if (wallet.userId !== req.user!.sub) { forbidden(res); return }
    if (wallet.status !== 'ACTIVE') { badRequest(res, 'Wallet is not active'); return }

    const amountUnits = displayToUnits(amountDisplay)
    if (amountUnits <= 0n) { badRequest(res, 'Amount must be positive'); return }

    await ensureLedgerAccount(prisma, walletId)

    const result = await ledgerCreditDebit({
      prisma,
      walletId,
      type: 'CREDIT',
      amountUnits,
      description: description ?? 'Simulated deposit',
      actorId: req.user!.sub,
      idempotencyKey: `deposit:${uuidv4()}`,
    })

    // Record transaction
    await prisma.transaction.create({
      data: {
        environment: 'INTERNAL',
        type: 'CREDIT',
        amountUnits,
        status: 'COMPLETED',
        toWalletId: walletId,
        idempotencyKey: `tx:${result.entryId}`,
      },
    })

    io.to(`wallet:${walletId}`).emit('balance:update', {
      walletId,
      balanceDisplay: result.balanceAfterDisplay,
    })

    ok(res, {
      balanceDisplay: result.balanceAfterDisplay,
      entryId: result.entryId,
      environment: 'INTERNAL',
    })
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Deposit failed')
  }
}

export async function withdraw(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { amountDisplay, description } = req.body
    const walletId = req.params.id

    const wallet = await prisma.virtualWallet.findUnique({ where: { id: walletId } })
    if (!wallet) { notFound(res); return }
    if (wallet.userId !== req.user!.sub) { forbidden(res); return }
    if (wallet.status !== 'ACTIVE') { badRequest(res, 'Wallet is not active'); return }

    const amountUnits = displayToUnits(amountDisplay)
    if (amountUnits <= 0n) { badRequest(res, 'Amount must be positive'); return }

    const result = await ledgerCreditDebit({
      prisma,
      walletId,
      type: 'DEBIT',
      amountUnits,
      description: description ?? 'Simulated withdrawal',
      actorId: req.user!.sub,
      idempotencyKey: `withdraw:${uuidv4()}`,
    })

    await prisma.transaction.create({
      data: {
        environment: 'INTERNAL',
        type: 'DEBIT',
        amountUnits,
        status: 'COMPLETED',
        fromWalletId: walletId,
        idempotencyKey: `tx:${result.entryId}`,
      },
    })

    io.to(`wallet:${walletId}`).emit('balance:update', {
      walletId,
      balanceDisplay: result.balanceAfterDisplay,
    })

    ok(res, {
      balanceDisplay: result.balanceAfterDisplay,
      entryId: result.entryId,
      environment: 'INTERNAL',
    })
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Withdrawal failed')
  }
}

export async function transfer(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { toWalletId, amountDisplay, description } = req.body
    const fromWalletId = req.params.id

    if (fromWalletId === toWalletId) { badRequest(res, 'Cannot transfer to same wallet'); return }

    const [fromWallet, toWallet] = await Promise.all([
      prisma.virtualWallet.findUnique({ where: { id: fromWalletId } }),
      prisma.virtualWallet.findUnique({ where: { id: toWalletId } }),
    ])

    if (!fromWallet) { notFound(res, 'Source wallet not found'); return }
    if (!toWallet) { notFound(res, 'Destination wallet not found'); return }
    if (fromWallet.userId !== req.user!.sub) { forbidden(res); return }
    if (fromWallet.status !== 'ACTIVE') { badRequest(res, 'Source wallet is not active'); return }
    if (toWallet.status !== 'ACTIVE') { badRequest(res, 'Destination wallet is not active'); return }

    const amountUnits = displayToUnits(amountDisplay)
    if (amountUnits <= 0n) { badRequest(res, 'Amount must be positive'); return }

    const baseKey = uuidv4()
    const entries = await ledgerTransfer({
      prisma,
      fromWalletId,
      toWalletId,
      amountUnits,
      description: description ?? 'Internal transfer',
      idempotencyKey: baseKey,
      actorId: req.user!.sub,
    })

    await prisma.transaction.create({
      data: {
        environment: 'INTERNAL',
        type: 'TRANSFER',
        amountUnits,
        status: 'COMPLETED',
        fromWalletId,
        toWalletId,
        idempotencyKey: `tx:${baseKey}`,
      },
    })

    io.to(`wallet:${fromWalletId}`).emit('balance:update', { walletId: fromWalletId })
    io.to(`wallet:${toWalletId}`).emit('balance:update', { walletId: toWalletId })

    ok(res, { entries, environment: 'INTERNAL' })
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Transfer failed')
  }
}

export async function getLedgerHistory(req: AuthRequest, res: Response): Promise<void> {
  try {
    const walletId = req.params.id
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))

    const wallet = await prisma.virtualWallet.findUnique({ where: { id: walletId } })
    if (!wallet) { notFound(res); return }
    if (wallet.userId !== req.user!.sub) { forbidden(res); return }

    const account = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: walletId } })
    if (!account) { ok(res, { items: [], total: 0, page, limit }); return }

    const [items, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where: { ledgerAccountId: account.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ledgerEntry.count({ where: { ledgerAccountId: account.id } }),
    ])

    const mapped = items.map(({ amountUnits, balanceAfter, ...e }) => ({
      ...e,
      amountDisplay: unitsToDisplay(amountUnits),
      balanceAfterDisplay: unitsToDisplay(balanceAfter),
    }))

    ok(res, { items: mapped, total, page, limit })
  } catch {
    serverError(res)
  }
}
