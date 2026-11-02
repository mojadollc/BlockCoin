import request from 'supertest'
import app from '../../apps/api/src/index'
import { prisma, createTestUser, authCookie, cleanupUser } from '../setup/helpers'

describe('Wallet API', () => {
  let userId: string
  let otherUserId: string
  let cookie: string
  let otherCookie: string
  let walletId: string

  beforeAll(async () => {
    const user = await createTestUser({ email: `wallet-test-${Date.now()}@test.com` })
    const other = await createTestUser({ email: `wallet-other-${Date.now()}@test.com` })
    userId = user.id
    otherUserId = other.id
    cookie = authCookie(user.id, user.email)
    otherCookie = authCookie(other.id, other.email)
  })

  afterAll(async () => {
    await cleanupUser(userId)
    await cleanupUser(otherUserId)
    await prisma.$disconnect()
  })

  describe('POST /api/v1/wallets', () => {
    it('creates a wallet with ledger account', async () => {
      const res = await request(app)
        .post('/api/v1/wallets')
        .set('Cookie', cookie)
        .send({ label: 'My Test Wallet' })

      expect(res.status).toBe(201)
      expect(res.body.data.label).toBe('My Test Wallet')
      expect(res.body.data.balanceDisplay).toBe('0.000000')
      walletId = res.body.data.id

      // Verify ledger account was created
      const account = await prisma.ledgerAccount.findUnique({
        where: { virtualWalletId: walletId },
      })
      expect(account).not.toBeNull()
      expect(account!.balanceUnits).toBe(0n)
    })

    it('rejects empty label', async () => {
      const res = await request(app)
        .post('/api/v1/wallets')
        .set('Cookie', cookie)
        .send({ label: '' })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/v1/wallets', () => {
    it('returns only the authenticated user wallets', async () => {
      const res = await request(app)
        .get('/api/v1/wallets')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
      const ids = res.body.data.map((w: { id: string }) => w.id)
      expect(ids).toContain(walletId)
    })
  })

  describe('GET /api/v1/wallets/:id', () => {
    it('returns wallet for owner', async () => {
      const res = await request(app)
        .get(`/api/v1/wallets/${walletId}`)
        .set('Cookie', cookie)
      expect(res.status).toBe(200)
      expect(res.body.data.id).toBe(walletId)
    })

    it('returns 403 for non-owner', async () => {
      const res = await request(app)
        .get(`/api/v1/wallets/${walletId}`)
        .set('Cookie', otherCookie)
      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/v1/wallets/:id/deposit', () => {
    it('credits the ledger and returns new balance', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/deposit`)
        .set('Cookie', cookie)
        .send({ amountDisplay: '100.000000' })

      expect(res.status).toBe(200)
      expect(res.body.data.balanceDisplay).toBe('100.000000')
      expect(res.body.data.environment).toBe('INTERNAL')

      const account = await prisma.ledgerAccount.findUnique({
        where: { virtualWalletId: walletId },
      })
      expect(account!.balanceUnits).toBe(100_000_000n)
    })

    it('rejects deposit to another user wallet', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/deposit`)
        .set('Cookie', otherCookie)
        .send({ amountDisplay: '50.000000' })
      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/v1/wallets/:id/withdraw', () => {
    it('debits the ledger correctly', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/withdraw`)
        .set('Cookie', cookie)
        .send({ amountDisplay: '40.000000' })

      expect(res.status).toBe(200)
      expect(res.body.data.balanceDisplay).toBe('60.000000')
    })

    it('rejects withdrawal exceeding balance', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/withdraw`)
        .set('Cookie', cookie)
        .send({ amountDisplay: '999.000000' })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/wallets/:id/transfer', () => {
    let toWalletId: string

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/v1/wallets')
        .set('Cookie', cookie)
        .send({ label: 'Transfer Target' })
      toWalletId = res.body.data.id
    })

    it('transfers between wallets atomically', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/transfer`)
        .set('Cookie', cookie)
        .send({ toWalletId, amountDisplay: '10.000000' })

      expect(res.status).toBe(200)
      expect(res.body.data.environment).toBe('INTERNAL')

      const [from, to] = await Promise.all([
        prisma.ledgerAccount.findUnique({ where: { virtualWalletId: walletId } }),
        prisma.ledgerAccount.findUnique({ where: { virtualWalletId: toWalletId } }),
      ])
      expect(from!.balanceUnits).toBe(50_000_000n)
      expect(to!.balanceUnits).toBe(10_000_000n)
    })

    it('rejects transfer to same wallet', async () => {
      const res = await request(app)
        .post(`/api/v1/wallets/${walletId}/transfer`)
        .set('Cookie', cookie)
        .send({ toWalletId: walletId, amountDisplay: '1.000000' })
      expect(res.status).toBe(400)
    })
  })
})
