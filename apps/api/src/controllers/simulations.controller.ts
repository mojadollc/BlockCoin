import { Response } from 'express'
import { prisma } from '../utils/prisma'
import { ok, created, badRequest, notFound, forbidden, serverError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import { unitsToDisplay } from '@blockcoin/shared'
import { createSimulation, cancelSimulation } from '../services/simulation.service'

export async function listSimulations(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))
    const status = req.query.status as string | undefined

    const wallets = await prisma.virtualWallet.findMany({ where: { userId }, select: { id: true } })
    const walletIds = wallets.map(w => w.id)

    if (walletIds.length === 0) { ok(res, { items: [], total: 0, page, limit }); return }

    const where = { walletId: { in: walletIds }, ...(status ? { status: status as any } : {}) }

    const [items, total] = await Promise.all([
      prisma.simulation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { wallet: { select: { label: true } }, template: { select: { name: true } } },
      }),
      prisma.simulation.count({ where }),
    ])

    const mapped = items.map(s => ({ ...s, amountUnits: s.amountUnits.toString(), amountDisplay: unitsToDisplay(s.amountUnits) }))
    ok(res, { items: mapped, total, page, limit })
  } catch {
    serverError(res)
  }
}

export async function getSimulation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub
    const sim = await prisma.simulation.findUnique({
      where: { id: req.params.id },
      include: {
        wallet: { select: { label: true, userId: true } },
        template: { select: { name: true } },
        events: { orderBy: { createdAt: 'asc' } },
        transaction: true,
      },
    })

    if (!sim) { notFound(res); return }
    if (sim.wallet.userId !== userId) { forbidden(res); return }

    ok(res, { ...sim, amountUnits: sim.amountUnits.toString(), amountDisplay: unitsToDisplay(sim.amountUnits) })
  } catch {
    serverError(res)
  }
}

export async function createUserSimulation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub
    const { walletId, type, amountDisplay, description, processingDelay, expiresInSeconds, templateId } = req.body

    const wallet = await prisma.virtualWallet.findUnique({ where: { id: walletId } })
    if (!wallet) { notFound(res, 'Wallet not found'); return }
    if (wallet.userId !== userId) { forbidden(res); return }
    if (wallet.status !== 'ACTIVE') { badRequest(res, 'Wallet is not active'); return }

    const sim = await createSimulation(prisma, {
      walletId, createdById: userId, type, amountDisplay,
      description, processingDelay, expiresInSeconds, templateId,
    })

    created(res, { ...sim, amountUnits: sim.amountUnits.toString(), amountDisplay: unitsToDisplay(sim.amountUnits) })
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Failed to create simulation')
  }
}

export async function cancelUserSimulation(req: AuthRequest, res: Response): Promise<void> {
  try {
    await cancelSimulation(prisma, req.params.id, req.user!.sub)
    ok(res, null, 'Simulation cancelled')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed'
    if (msg === 'Forbidden') { forbidden(res); return }
    if (msg === 'Simulation not found') { notFound(res); return }
    badRequest(res, msg)
  }
}
