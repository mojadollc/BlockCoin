import request from 'supertest'
import app from '../../apps/api/src/index'
import { prisma, cleanupUser } from '../setup/helpers'

describe('Auth API', () => {
  const email = `auth-test-${Date.now()}@blockcoin.test`
  const password = 'TestPass1!'
  let userId: string

  afterAll(async () => {
    if (userId) await cleanupUser(userId)
    await prisma.$disconnect()
  })

  describe('POST /api/v1/auth/register', () => {
    it('registers a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password, firstName: 'Test', lastName: 'User' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.email).toBe(email)
      expect(res.body.data.passwordHash).toBeUndefined()
      userId = res.body.data.id
    })

    it('rejects duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email, password, firstName: 'Test', lastName: 'User' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('rejects weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'other@test.com', password: 'weak', firstName: 'A', lastName: 'B' })

      expect(res.status).toBe(400)
    })

    it('rejects invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'not-an-email', password, firstName: 'A', lastName: 'B' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.email).toBe(email)
      // Cookie should be set
      expect(res.headers['set-cookie']).toBeDefined()
    })

    it('rejects wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPass1!' })

      expect(res.status).toBe(401)
    })

    it('rejects unknown email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@blockcoin.test', password })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    it('returns user when authenticated', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })

      const cookies = loginRes.headers['set-cookie'] as string[]

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookies)

      expect(res.status).toBe(200)
      expect(res.body.data.email).toBe(email)
    })

    it('returns 401 without cookie', async () => {
      const res = await request(app).get('/api/v1/auth/me')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    it('clears cookies on logout', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password })

      const cookies = loginRes.headers['set-cookie'] as string[]

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)

      expect(res.status).toBe(200)
    })
  })
})
