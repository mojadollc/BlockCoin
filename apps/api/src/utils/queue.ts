import { Queue } from 'bullmq'
import IORedis from 'ioredis'

let _connection: IORedis | null = null

export function getRedisConnection(): IORedis {
  if (!_connection) {
    _connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    })
  }
  return _connection
}

let _queue: Queue | null = null

export function getSimulationQueue(): Queue {
  if (!_queue) {
    _queue = new Queue('simulations', { connection: getRedisConnection() })
  }
  return _queue
}

export const JOBS = {
  PROCESS_SIMULATION: 'process-simulation',
  EXPIRE_SIMULATION: 'expire-simulation',
  FAIL_SIMULATION: 'fail-simulation',
}
