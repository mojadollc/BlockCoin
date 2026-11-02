// Global test setup — runs once before all test suites
export default async function globalSetup() {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-min-64-chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-min-64-chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  process.env.JWT_EXPIRES_IN = '15m'
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? ''
  process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? process.env.REDIS_URL ?? 'redis://localhost:6379'
}
