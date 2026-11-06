import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, created, badRequest, notFound, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'
import { unitsToDisplay } from '@blockcoin/shared'
import { createSimulation, adminCancelSimulation } from '../../services/simulation.service'
import { getSimulationQueue, JOBS } from '../../utils/queue'

function sanitizeDesc(s: string | null | undefined): string | null {
  if (!s) return s ?? null
  return s
    .replace(/\[Security Test\]\s*/gi, '')
    .replace(/Security test forced failure/gi, 'Failure')
    .replace(/\bsimulation\b/gi, 'transaction')
    .replace(/\bscenario\b/gi, 'test')
    .trim() || null
}

export async function adminListSimulations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
    const status = req.query.status as string | undefined
    const walletId = req.query.walletId as string | undefined

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (walletId) where.walletId = walletId

    const [items, total] = await Promise.all([
      prisma.simulation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          wallet: { select: { label: true, user: { select: { email: true } } } },
          template: { select: { name: true } },
          createdBy: { select: { email: true } },
        },
      }),
      prisma.simulation.count({ where }),
    ])

    const mapped = items.map(s => ({
      ...s,
      amountUnits: s.amountUnits.toString(),
      amountDisplay: unitsToDisplay(s.amountUnits),
      description: sanitizeDesc(s.description),
    }))
    ok(res, { items: mapped, total, page, limit })
  } catch {
    serverError(res)
  }
}

export async function adminGetSimulation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const sim = await prisma.simulation.findUnique({
      where: { id: req.params.id },
      include: {
        wallet: { select: { label: true, user: { select: { email: true } } } },
        template: { select: { name: true } },
        createdBy: { select: { email: true } },
        events: { orderBy: { createdAt: 'asc' } },
        transaction: true,
      },
    })
    if (!sim) { notFound(res); return }
    ok(res, { ...sim, amountUnits: sim.amountUnits.toString(), amountDisplay: unitsToDisplay(sim.amountUnits), description: sanitizeDesc(sim.description) })
  } catch {
    serverError(res)
  }
}

export async function adminCreateSimulation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { walletId, type, amountDisplay, description, processingDelay, expiresInSeconds, templateId } = req.body

    const wallet = await prisma.virtualWallet.findUnique({ where: { id: walletId } })
    if (!wallet) { notFound(res, 'Wallet not found'); return }
    if (wallet.status !== 'ACTIVE') { badRequest(res, 'Wallet is not active'); return }

    const sim = await createSimulation(prisma, {
      walletId,
      createdById: req.user!.sub,
      type,
      amountDisplay,
      description,
      processingDelay,
      expiresInSeconds,
      templateId,
    })

    await prisma.adminLog.create({
      data: {
        actorId: req.user!.sub,
        action: 'CREATE_SIMULATION',
        targetType: 'Simulation',
        targetId: sim.id,
        metadata: { walletId, type, amountDisplay },
      },
    })

    created(res, { ...sim, amountUnits: sim.amountUnits.toString(), amountDisplay: unitsToDisplay(sim.amountUnits) })
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Failed')
  }
}

export async function adminCancelSim(req: AuthRequest, res: Response): Promise<void> {
  try {
    await adminCancelSimulation(prisma, req.params.id)
    await prisma.adminLog.create({
      data: {
        actorId: req.user!.sub,
        action: 'CANCEL_SIMULATION',
        targetType: 'Simulation',
        targetId: req.params.id,
      },
    })
    ok(res, null, 'Simulation cancelled')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed'
    badRequest(res, msg)
  }
}

export async function adminForceStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status, note } = req.body
    const allowed = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED']
    if (!allowed.includes(status)) { badRequest(res, 'Invalid status'); return }

    const sim = await prisma.simulation.findUnique({ where: { id: req.params.id } })
    if (!sim) { notFound(res); return }

    // If forcing COMPLETED, apply ledger entry
    if (status === 'COMPLETED' && sim.status !== 'COMPLETED') {
      const queue = getSimulationQueue()
      await queue.remove(`process:${sim.id}`).catch(() => {})
      await queue.remove(`expire:${sim.id}`).catch(() => {})

      await prisma.$transaction(async (tx) => {
        const account = await tx.ledgerAccount.findUnique({ where: { virtualWalletId: sim.walletId } })
        if (!account) throw new Error('Ledger account not found')

        const newBalance = sim.type === 'CREDIT'
          ? account.balanceUnits + sim.amountUnits
          : account.balanceUnits - sim.amountUnits

        if (newBalance < 0n) throw new Error('Insufficient balance for completion')

        await tx.ledgerAccount.update({ where: { id: account.id }, data: { balanceUnits: newBalance } })
        await tx.ledgerEntry.create({
          data: {
            ledgerAccountId: account.id,
            type: sim.type,
            amountUnits: sim.amountUnits,
            balanceAfter: newBalance,
            description: `Admin forced completion: ${sim.description ?? sim.id}`,
            idempotencyKey: `admin-force:${sim.id}`,
            actorId: req.user!.sub,
          },
        })
        await tx.simulation.update({
          where: { id: sim.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        })
        await tx.simulationEvent.create({
          data: { simulationId: sim.id, fromStatus: sim.status, toStatus: 'COMPLETED', note: note ?? 'Admin forced' },
        })
      })
    } else {
      await prisma.simulation.update({ where: { id: sim.id }, data: { status: status as any } })
      await prisma.simulationEvent.create({
        data: { simulationId: sim.id, fromStatus: sim.status, toStatus: status as any, note: note ?? 'Admin override' },
      })
    }

    await prisma.adminLog.create({
      data: {
        actorId: req.user!.sub,
        action: 'FORCE_SIMULATION_STATUS',
        targetType: 'Simulation',
        targetId: sim.id,
        metadata: { from: sim.status, to: status },
      },
    })

    ok(res, null, `Status set to ${status}`)
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Failed')
  }
}
