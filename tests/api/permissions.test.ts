import request from 'supertest'
import app from '../../apps/api/src/index'
import { prisma, createTestUser, authCookie, cleanupUser } from '../setup/helpers'

describe('Permission / RBAC', () => {
  let userId: string
  let adminId: string
  let userCookie: string
  let adminCookie: string

  beforeAll(async () => {
    const user = await createTestUser({ email: `rbac-user-${Date.now()}@test.com` })
    const admin = await createTestUser({ email: `rbac-admin-${Date.now()}@test.com`, role: 'ADMIN' })
    userId = user.id
    adminId = admin.id
    userCookie = authCookie(user.id, user.email, 'USER')
    adminCookie = authCookie(admin.id, admin.email, 'ADMIN')
  })

  afterAll(async () => {
    await cleanupUser(userId)
    await cleanupUser(adminId)
    await prisma.$disconnect()
  })

  describe('Admin endpoints reject regular users', () => {
    const adminEndpoints = [
      { method: 'get', path: '/api/v1/admin/dashboard' },
      { method: 'get', path: '/api/v1/admin/users' },
      { method: 'get', path: '/api/v1/admin/wallets' },
      { method: 'get', path: '/api/v1/admin/transactions' },
      { method: 'get', path: '/api/v1/admin/audit-logs' },
      { method: 'get', path: '/api/v1/admin/settings' },
      { method: 'get', path: '/api/v1/admin/simulations' },
      { method: 'get', path: '/api/v1/admin/security/scenarios' },
    ]

    adminEndpoints.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} returns 403 for USER`, async () => {
        const res = await (request(app) as any)[method](path).set('Cookie', userCookie)
        expect(res.status).toBe(403)
      })
    })
  })

  describe('Admin endpoints allow admins', () => {
    it('GET /api/v1/admin/dashboard returns 200 for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Cookie', adminCookie)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('GET /api/v1/admin/users returns 200 for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Cookie', adminCookie)
      expect(res.status).toBe(200)
    })
  })

  describe('Unauthenticated requests', () => {
    it('GET /api/v1/wallets returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/wallets')
      expect(res.status).toBe(401)
    })

    it('GET /api/v1/admin/dashboard returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard')
      expect(res.status).toBe(401)
    })

    it('GET /api/v1/simulations returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/simulations')
      expect(res.status).toBe(401)
    })
  })
})
