import request from 'supertest'
import app from '../../apps/api/src/index'
import { prisma, createTestUser, createTestWallet, creditWallet, authCookie, cleanupUser } from '../setup/helpers'

describe('Security Tests', () => {
  let userId: string
  let otherUserId: string
  let adminId: string
  let cookie: string
  let otherCookie: string
  let adminCookie: string
  let walletId: string

  beforeAll(async () => {
    const user = await createTestUser({ email: `sec-user-${Date.now()}@test.com` })
    const other = await createTestUser({ email: `sec-other-${Date.now()}@test.com` })
    const admin = await createTestUser({ email: `sec-admin-${Date.now()}@test.com`, role: 'ADMIN' })
    userId = user.id
    otherUserId = other.id
    adminId = admin.id
    cookie = authCookie(user.id, user.email)
    otherCookie = authCookie(other.id, other.email)
    adminCookie = authCookie(admin.id, admin.email, 'ADMIN')

    const wallet = await createTestWallet(userId)
    walletId = wallet.id
    await creditWallet(walletId, 100_000_000n)
  })

  afterAll(async () => {
    await cleanupUser(userId)
    await cleanupUser(otherUserId)
    await cleanupUser(adminId)
    await prisma.$disconnect()
  })

  describe('User data isolation', () => {
    it('user cannot access another user wallet', async () => {
      const res = await request(app)
        .get(`/api/v1/wallets/${walletId}`)
        .set('Cookie', otherCookie)
      expect(res.status).toBe(403)
    })

    it('user cannot deposit to another user wallet', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/deposit`)
        .set('Cookie', otherCookie)
        .send({ amountDisplay: '1.000000' })
      expect(res.status).toBe(403)
    })

    it('user cannot withdraw from another user wallet', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/withdraw`)
        .set('Cookie', otherCookie)
        .send({ amountDisplay: '1.000000' })
      expect(res.status).toBe(403)
    })

    it('user cannot view another user transactions', async () => {
      // Create a transaction for userId
      await request(app)
        .post(`/api/v1/wallets/${walletId}/deposit`)
        .set('Cookie', cookie)
        .send({ amountDisplay: '1.000000' })

      const txRes = await request(app)
        .get('/api/v1/transactions')
        .set('Cookie', cookie)

      const txIds = txRes.body.data.items.map((t: { id: string }) => t.id)

      // Other user should not see these transactions
      for (const txId of txIds.slice(0, 3)) {
        const res = await request(app)
          .get(`/api/v1/transactions/${txId}`)
          .set('Cookie', otherCookie)
        expect(res.status).toBe(403)
      }
    })
  })

  describe('Input validation', () => {
    it('rejects SQL injection in email field', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: "' OR '1'='1", password: 'anything' })
      expect(res.status).toBe(400)
    })

    it('rejects negative deposit amount', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/deposit`)
        .set('Cookie', cookie)
        .send({ amountDisplay: '-100.000000' })
      expect(res.status).toBe(400)
    })

    it('rejects non-numeric amount', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/deposit`)
        .set('Cookie', cookie)
        .send({ amountDisplay: 'abc' })
      expect(res.status).toBe(400)
    })

    it('rejects oversized description', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/deposit`)
        .set('Cookie', cookie)
        .send({ amountDisplay: '1.000000', description: 'x'.repeat(1000) })
      expect(res.status).toBe(400)
    })
  })

  describe('Admin balance adjustment audit', () => {
    it('admin adjustment creates audit log entry', async () => {
      const logsBefore = await prisma.adminLog.count({ where: { action: 'ADJUST_BALANCE' } })

      await request(app)
        .post(`/api/v1/admin/wallets/${walletId}/adjust`)
        .set('Cookie', adminCookie)
        .send({ amountDisplay: '10.000000', type: 'CREDIT', description: 'Audit test' })

      const logsAfter = await prisma.adminLog.count({ where: { action: 'ADJUST_BALANCE' } })
      expect(logsAfter).toBe(logsBefore + 1)
    })

    it('regular user cannot adjust balances', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/wallets/${walletId}/adjust`)
        .set('Cookie', cookie)
        .send({ amountDisplay: '10.000000', type: 'CREDIT', description: 'Unauthorized' })
      expect(res.status).toBe(403)
    })
  })

  describe('Environment separation', () => {
    it('internal transactions have environment=INTERNAL', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/deposit`)
        .set('Cookie', cookie)
        .send({ amountDisplay: '1.000000' })

      expect(res.body.data.environment).toBe('INTERNAL')
    })

    it('internal transactions never have blockchain hash fields', async () => {
      const txRes = await request(app)
        .get('/api/v1/transactions')
        .set('Cookie', cookie)

      const txs = txRes.body.data.items
      txs.forEach((tx: Record<string, unknown>) => {
        expect(tx.txHash).toBeUndefined()
        expect(tx.blockNumber).toBeUndefined()
        expect(tx.confirmations).toBeUndefined()
      })
    })
  })

  describe('Suspended user access', () => {
    it('suspended user cannot log in', async () => {
      const suspendedEmail = `suspended-${Date.now()}@test.com`
      const suspendedUser = await createTestUser({
        email: suspendedEmail,
        password: 'TestPass1!',
        isActive: false,
      })

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: suspendedEmail, password: 'TestPass1!' })

      expect(res.status).toBe(401)
      await cleanupUser(suspendedUser.id)
    })
  })
})
