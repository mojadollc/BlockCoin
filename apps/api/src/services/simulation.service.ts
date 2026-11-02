import { PrismaClient, SimulationStatus, TransactionType } from '@blockcoin/database'
import { displayToUnits } from '@blockcoin/shared'
import { getSimulationQueue, JOBS } from '../utils/queue'
import { v4 as uuidv4 } from 'uuid'

export interface CreateSimulationInput {
  walletId: string
  createdById: string
  type: TransactionType
  amountDisplay: string
  description?: string
  processingDelay?: number
  expiresInSeconds?: number
  templateId?: string
  startAsPending?: boolean
}

export async function createSimulation(prisma: PrismaClient, input: CreateSimulationInput) {
  const amountUnits = displayToUnits(input.amountDisplay)
  if (amountUnits <= 0n) throw new Error('Amount must be positive')

  const expiresAt = input.expiresInSeconds
    ? new Date(Date.now() + input.expiresInSeconds * 1000)
    : undefined

  const sim = await prisma.$transaction(async (tx) => {
    const simulation = await tx.simulation.create({
      data: {
        walletId: input.walletId,
        createdById: input.createdById,
        type: input.type,
        amountUnits,
        description: input.description,
        processingDelay: input.processingDelay ?? 0,
        expiresAt,
        templateId: input.templateId,
        status: 'CREATED',
      },
    })

    await tx.simulationEvent.create({
      data: { simulationId: simulation.id, toStatus: 'CREATED' },
    })

    return simulation
  })

  const queue = getSimulationQueue()

  // Schedule expiration job first (if applicable)
  if (expiresAt) {
    const delay = Math.max(0, expiresAt.getTime() - Date.now())
    await queue.add(JOBS.EXPIRE_SIMULATION, { simulationId: sim.id }, {
      delay,
      jobId: `expire:${sim.id}`,
      removeOnComplete: true,
    })
  }

  // Enqueue processing job with optional delay
  const processDelay = (input.processingDelay ?? 0) * 1000
  await queue.add(JOBS.PROCESS_SIMULATION, { simulationId: sim.id }, {
    delay: processDelay,
    jobId: `process:${sim.id}`,
    removeOnComplete: true,
    removeOnFail: false,
  })

  return sim
}

export async function cancelSimulation(prisma: PrismaClient, simulationId: string, userId: string) {
  const sim = await prisma.simulation.findUnique({ where: { id: simulationId } })
  if (!sim) throw new Error('Simulation not found')

  const isOwner = sim.createdById === userId
  if (!isOwner) throw new Error('Forbidden')

  const cancellable: SimulationStatus[] = ['CREATED', 'PENDING']
  if (!cancellable.includes(sim.status)) {
    throw new Error(`Cannot cancel simulation in status ${sim.status}`)
  }

  const queue = getSimulationQueue()
  await queue.remove(`process:${simulationId}`).catch(() => {})
  await queue.remove(`expire:${simulationId}`).catch(() => {})

  await prisma.$transaction(async (tx) => {
    await tx.simulation.update({
      where: { id: simulationId },
      data: { status: 'CANCELLED' },
    })
    await tx.simulationEvent.create({
      data: { simulationId, fromStatus: sim.status, toStatus: 'CANCELLED' },
    })
  })
}

export async function adminCancelSimulation(prisma: PrismaClient, simulationId: string) {
  const sim = await prisma.simulation.findUnique({ where: { id: simulationId } })
  if (!sim) throw new Error('Simulation not found')

  const terminal: SimulationStatus[] = ['COMPLETED', 'FAILED', 'EXPIRED', 'CANCELLED']
  if (terminal.includes(sim.status)) throw new Error(`Simulation already in terminal state: ${sim.status}`)

  const queue = getSimulationQueue()
  await queue.remove(`process:${simulationId}`).catch(() => {})
  await queue.remove(`expire:${simulationId}`).catch(() => {})

  await prisma.$transaction(async (tx) => {
    await tx.simulation.update({ where: { id: simulationId }, data: { status: 'CANCELLED' } })
    await tx.simulationEvent.create({
      data: { simulationId, fromStatus: sim.status, toStatus: 'CANCELLED' },
    })
  })
}
