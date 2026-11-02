import 'dotenv/config'
import IORedis from 'ioredis'
import { Worker, Job } from 'bullmq'
import { PrismaClient, SimulationStatus } from '@blockcoin/database'
import { unitsToDisplay } from '@blockcoin/shared'

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const prisma = new PrismaClient()

async function transitionStatus(
  simulationId: string,
  from: SimulationStatus,
  to: SimulationStatus,
  note?: string
) {
  await prisma.simulation.update({ where: { id: simulationId }, data: { status: to } })
  await prisma.simulationEvent.create({
    data: { simulationId, fromStatus: from, toStatus: to, note: note ?? null },
  })
}

async function processSimulation(simulationId: string) {
  const sim = await prisma.simulation.findUnique({ where: { id: simulationId } })
  if (!sim) return
  if (!['CREATED', 'PENDING'].includes(sim.status)) return

  // CREATED → PENDING
  if (sim.status === 'CREATED') {
    await transitionStatus(simulationId, 'CREATED', 'PENDING')
  }

  // PENDING → PROCESSING
  await transitionStatus(simulationId, 'PENDING', 'PROCESSING')

  // Apply processing delay
  if (sim.processingDelay > 0) {
    await new Promise(r => setTimeout(r, sim.processingDelay * 1000))
  }

  // Re-fetch to check if expired/cancelled during delay
  const current = await prisma.simulation.findUnique({ where: { id: simulationId } })
  if (!current || current.status !== 'PROCESSING') return

  // PROCESSING → COMPLETED (with atomic ledger entry)
  await prisma.$transaction(async (tx) => {
    const account = await tx.ledgerAccount.findUnique({
      where: { virtualWalletId: sim.walletId },
    })
    if (!account) throw new Error('Ledger account not found')

    const newBalance =
      sim.type === 'CREDIT'
        ? account.balanceUnits + sim.amountUnits
        : account.balanceUnits - sim.amountUnits

    if (newBalance < 0n) throw new Error('Insufficient balance')

    await tx.ledgerAccount.update({
      where: { id: account.id },
      data: { balanceUnits: newBalance },
    })

    await tx.ledgerEntry.create({
      data: {
        ledgerAccountId: account.id,
        type: sim.type,
        amountUnits: sim.amountUnits,
        balanceAfter: newBalance,
        description: sim.description ?? `Simulation ${sim.id}`,
        idempotencyKey: `sim:${sim.id}`,
      },
    })

    const txRecord = await tx.transaction.create({
      data: {
        simulationId: sim.id,
        environment: 'INTERNAL',
        type: sim.type,
        amountUnits: sim.amountUnits,
        status: 'COMPLETED',
        toWalletId: sim.type === 'CREDIT' ? sim.walletId : null,
        fromWalletId: sim.type === 'DEBIT' ? sim.walletId : null,
        idempotencyKey: `tx:sim:${sim.id}`,
      },
    })

    await tx.simulation.update({
      where: { id: simulationId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })

    await tx.simulationEvent.create({
      data: { simulationId, fromStatus: 'PROCESSING', toStatus: 'COMPLETED' },
    })

    console.log(`[worker] Simulation ${simulationId} COMPLETED — balance: ${unitsToDisplay(newBalance)} USDT`)
  })
}

async function expireSimulation(simulationId: string) {
  const sim = await prisma.simulation.findUnique({ where: { id: simulationId } })
  if (!sim) return

  const expirable: SimulationStatus[] = ['CREATED', 'PENDING', 'PROCESSING']
  if (!expirable.includes(sim.status)) return

  await prisma.$transaction(async (tx) => {
    await tx.simulation.update({ where: { id: simulationId }, data: { status: 'EXPIRED' } })
    await tx.simulationEvent.create({
      data: { simulationId, fromStatus: sim.status, toStatus: 'EXPIRED', note: 'Expired by scheduler' },
    })
  })

  console.log(`[worker] Simulation ${simulationId} EXPIRED`)
}

async function failSimulation(simulationId: string, reason?: string) {
  const sim = await prisma.simulation.findUnique({ where: { id: simulationId } })
  if (!sim) return
  if (['COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(sim.status)) return

  await prisma.$transaction(async (tx) => {
    await tx.simulation.update({ where: { id: simulationId }, data: { status: 'FAILED' } })
    await tx.simulationEvent.create({
      data: { simulationId, fromStatus: sim.status, toStatus: 'FAILED', note: reason ?? 'Job failed' },
    })
  })

  console.log(`[worker] Simulation ${simulationId} FAILED — ${reason}`)
}

const worker = new Worker(
  'simulations',
  async (job: Job) => {
    const { simulationId } = job.data as { simulationId: string }
    console.log(`[worker] Processing job ${job.name} for simulation ${simulationId}`)

    if (job.name === 'process-simulation') {
      await processSimulation(simulationId)
    } else if (job.name === 'expire-simulation') {
      await expireSimulation(simulationId)
    } else if (job.name === 'fail-simulation') {
      await failSimulation(simulationId, job.data.reason)
    }
  },
  { connection, concurrency: 5 }
)

worker.on('failed', async (job, err) => {
  console.error(`[worker] Job ${job?.id} (${job?.name}) failed:`, err.message)
  if (job?.name === 'process-simulation' && job.data?.simulationId) {
    await failSimulation(job.data.simulationId, err.message).catch(() => {})
  }
})

worker.on('completed', job => {
  console.log(`[worker] Job ${job.id} (${job.name}) completed`)
})

console.log('[worker] BlockCoin Worker started — listening for simulation jobs')
