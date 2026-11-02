import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { PrismaClient } from '@blockcoin/database'

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const prisma = new PrismaClient()

export const simulationQueue = new Queue('simulations', { connection })

export const JOBS = {
  PROCESS_SIMULATION: 'process-simulation',
  EXPIRE_SIMULATION: 'expire-simulation',
}
