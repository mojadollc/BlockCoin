import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, badRequest, notFound, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'
import { displayToUnits } from '@blockcoin/shared'
import { ensureLedgerAccount, ledgerCreditDebit } from '../../services/ledger.service'
import { io } from '../../index'

export async function adminListDeposits(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
    const status = req.query.status as string | undefined

    const where = status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}

    const [items, total] = await Promise.all([
      prisma.depositRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          wallet: { select: { label: true, address: true } },
        },
      }),
      prisma.depositRequest.count({ where }),
    ])

    ok(res, { items, total, page, limit })
  } catch {
    serverError(res)
  }
}

export async function approveDeposit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { adminNote } = req.body

    const deposit = await prisma.depositRequest.findUnique({ where: { id } })
    if (!deposit) { notFound(res); return }
    if (deposit.status !== 'PENDING') { badRequest(res, 'Deposit is not pending'); return }

    const amountUnits = displayToUnits(deposit.amountDisplay)
    if (amountUnits <= 0n) { badRequest(res, 'Invalid amount'); return }

    await ensureLedgerAccount(prisma, deposit.walletId)

    // Run ledger credit + deposit status update + audit log atomically
    let balanceAfterDisplay: string
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Credit the ledger inside the transaction
        const ledgerResult = await ledgerCreditDebit({
          prisma: tx as unknown as typeof prisma,
          walletId: deposit.walletId,
          type: 'CREDIT',
          amountUnits,
          description: `USDT deposit (${deposit.network}) — tx: ${deposit.txHash.slice(0, 16)}…`,
          actorId: req.user!.sub,
          idempotencyKey: `deposit:${deposit.id}`,
        })

        await tx.transaction.create({
          data: {
            environment: 'INTERNAL',
            type: 'CREDIT',
            amountUnits,
            status: 'COMPLETED',
            toWalletId: deposit.walletId,
            idempotencyKey: `tx:deposit:${deposit.id}`,
          },
        })

        await tx.depositRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            adminNote: adminNote ?? null,
            reviewedBy: req.user!.sub,
            reviewedAt: new Date(),
          },
        })

        await tx.adminLog.create({
          data: {
            actorId: req.user!.sub,
            action: 'APPROVE_DEPOSIT',
            targetType: 'DepositRequest',
            targetId: id,
            metadata: { txHash: deposit.txHash, amountDisplay: deposit.amountDisplay, network: deposit.network },
          },
        })

        return ledgerResult
      })

      balanceAfterDisplay = result.balanceAfterDisplay
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg === 'Insufficient balance') { badRequest(res, msg); return }
      throw e
    }

    io.to(`wallet:${deposit.walletId}`).emit('balance:update', {
      walletId: deposit.walletId,
      balanceDisplay: balanceAfterDisplay,
    })

    ok(res, { balanceAfterDisplay })
  } catch (e) {
    serverError(res)
  }
}

export async function rejectDeposit(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { adminNote } = req.body

    const deposit = await prisma.depositRequest.findUnique({ where: { id } })
    if (!deposit) { notFound(res); return }
    if (deposit.status !== 'PENDING' && deposit.status !== 'PROCESSING') { badRequest(res, 'Deposit cannot be rejected'); return }

    await prisma.$transaction([
      prisma.depositRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNote: adminNote ?? null,
          reviewedBy: req.user!.sub,
          reviewedAt: new Date(),
        },
      }),
      prisma.adminLog.create({
        data: {
          actorId: req.user!.sub,
          action: 'REJECT_DEPOSIT',
          targetType: 'DepositRequest',
          targetId: id,
          metadata: { txHash: deposit.txHash, adminNote },
        },
      }),
    ])

    ok(res, null, 'Deposit rejected')
  } catch {
    serverError(res)
  }
}

export async function setDepositStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params
    const { status, adminNote } = req.body

    const allowed = ['PENDING', 'PROCESSING', 'APPROVED', 'REJECTED']
    if (!allowed.includes(status)) { badRequest(res, 'Invalid status'); return }

    const deposit = await prisma.depositRequest.findUnique({ where: { id } })
    if (!deposit) { notFound(res); return }
    if (deposit.status === 'APPROVED') { badRequest(res, 'Already approved'); return }

    // APPROVED path — credit the ledger
    if (status === 'APPROVED') {
      const amountUnits = displayToUnits(deposit.amountDisplay)
      if (amountUnits <= 0n) { badRequest(res, 'Invalid amount'); return }
      await ensureLedgerAccount(prisma, deposit.walletId)

      let balanceAfterDisplay: string
      try {
        const result = await prisma.$transaction(async (tx) => {
          const ledgerResult = await ledgerCreditDebit({
            prisma: tx as unknown as typeof prisma,
            walletId: deposit.walletId,
            type: 'CREDIT',
            amountUnits,
            description: `USDT deposit (${deposit.network}) — tx: ${deposit.txHash.slice(0, 16)}…`,
            actorId: req.user!.sub,
            idempotencyKey: `deposit:${deposit.id}`,
          })
          await tx.transaction.create({
            data: {
              environment: 'INTERNAL',
              type: 'CREDIT',
              amountUnits,
              status: 'COMPLETED',
              toWalletId: deposit.walletId,
              idempotencyKey: `tx:deposit:${deposit.id}`,
            },
          })
          await tx.depositRequest.update({
            where: { id },
            data: { status: 'APPROVED', adminNote: adminNote ?? null, reviewedBy: req.user!.sub, reviewedAt: new Date() },
          })
          await tx.adminLog.create({
            data: {
              actorId: req.user!.sub, action: 'APPROVE_DEPOSIT',
              targetType: 'DepositRequest', targetId: id,
              metadata: { txHash: deposit.txHash, amountDisplay: deposit.amountDisplay, network: deposit.network },
            },
          })
          return ledgerResult
        })
        balanceAfterDisplay = result.balanceAfterDisplay
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        if (msg === 'Insufficient balance') { badRequest(res, msg); return }
        throw e
      }

      io.to(`wallet:${deposit.walletId}`).emit('balance:update', { walletId: deposit.walletId, balanceDisplay: balanceAfterDisplay })
      ok(res, { balanceAfterDisplay })
      return
    }

    // PENDING / PROCESSING / REJECTED — simple status update
    await prisma.$transaction([
      prisma.depositRequest.update({
        where: { id },
        data: {
          status: status as 'PENDING' | 'PROCESSING' | 'REJECTED',
          adminNote: adminNote ?? null,
          ...(status === 'REJECTED' ? { reviewedBy: req.user!.sub, reviewedAt: new Date() } : {}),
        },
      }),
      prisma.adminLog.create({
        data: {
          actorId: req.user!.sub, action: `SET_DEPOSIT_${status}`,
          targetType: 'DepositRequest', targetId: id,
          metadata: { txHash: deposit.txHash, adminNote },
        },
      }),
    ])

    ok(res, null, `Deposit marked ${status}`)
  } catch {
    serverError(res)
  }
}
