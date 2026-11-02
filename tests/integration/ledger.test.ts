import { prisma, createTestUser, createTestWallet, creditWallet, cleanupUser } from '../setup/helpers'
import { ledgerCreditDebit, ledgerTransfer } from '../../apps/api/src/services/ledger.service'

describe('Ledger Integrity', () => {
  let userId: string
  let walletId: string
  let wallet2Id: string

  beforeAll(async () => {
    const user = await createTestUser({ email: `ledger-${Date.now()}@test.com` })
    userId = user.id
    const w1 = await createTestWallet(userId, 'Ledger W1')
    const w2 = await createTestWallet(userId, 'Ledger W2')
    walletId = w1.id
    wallet2Id = w2.id
  })

  afterAll(async () => {
    await cleanupUser(userId)
    await prisma.$disconnect()
  })

  it('credits balance using BigInt — no floating point', async () => {
    const result = await ledgerCreditDebit({
      prisma,
      walletId,
      type: 'CREDIT',
      amountUnits: 1_500_000n, // 1.500000 USDT
      description: 'Integrity test credit',
    })

    expect(result.balanceAfterUnits).toBe(1_500_000n)
    expect(result.balanceAfterDisplay).toBe('1.500000')
  })

  it('debits balance correctly', async () => {
    const result = await ledgerCreditDebit({
      prisma,
      walletId,
      type: 'DEBIT',
      amountUnits: 500_000n, // 0.500000 USDT
      description: 'Integrity test debit',
    })

    expect(result.balanceAfterUnits).toBe(1_000_000n)
    expect(result.balanceAfterDisplay).toBe('1.000000')
  })

  it('rejects debit exceeding balance', async () => {
    await expect(
      ledgerCreditDebit({
        prisma,
        walletId,
        type: 'DEBIT',
        amountUnits: 999_000_000n,
        description: 'Should fail',
      })
    ).rejects.toThrow('Insufficient balance')
  })

  it('enforces idempotency — duplicate key returns existing entry', async () => {
    const key = `idem-test-${Date.now()}`

    const first = await ledgerCreditDebit({
      prisma,
      walletId,
      type: 'CREDIT',
      amountUnits: 100_000n,
      description: 'Idempotency test',
      idempotencyKey: key,
    })

    const second = await ledgerCreditDebit({
      prisma,
      walletId,
      type: 'CREDIT',
      amountUnits: 100_000n,
      description: 'Idempotency test',
      idempotencyKey: key,
    })

    // Same entry returned — balance not doubled
    expect(first.entryId).toBe(second.entryId)

    const account = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: walletId } })
    // Balance should only have been credited once
    const entries = await prisma.ledgerEntry.findMany({
      where: { idempotencyKey: key },
    })
    expect(entries).toHaveLength(1)
  })

  it('transfers atomically — both sides update or neither', async () => {
    await creditWallet(walletId, 10_000_000n) // 10 USDT

    const before1 = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: walletId } })
    const before2 = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: wallet2Id } })

    await ledgerTransfer({
      prisma,
      fromWalletId: walletId,
      toWalletId: wallet2Id,
      amountUnits: 5_000_000n,
      description: 'Atomic transfer test',
    })

    const after1 = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: walletId } })
    const after2 = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: wallet2Id } })

    expect(after1!.balanceUnits).toBe(before1!.balanceUnits - 5_000_000n)
    expect(after2!.balanceUnits).toBe(before2!.balanceUnits + 5_000_000n)
  })

  it('transfer fails atomically on insufficient balance', async () => {
    const before1 = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: walletId } })
    const before2 = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: wallet2Id } })

    await expect(
      ledgerTransfer({
        prisma,
        fromWalletId: walletId,
        toWalletId: wallet2Id,
        amountUnits: 999_000_000_000n, // way more than balance
        description: 'Should fail atomically',
      })
    ).rejects.toThrow('Insufficient balance')

    // Both balances must be unchanged
    const after1 = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: walletId } })
    const after2 = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: wallet2Id } })
    expect(after1!.balanceUnits).toBe(before1!.balanceUnits)
    expect(after2!.balanceUnits).toBe(before2!.balanceUnits)
  })

  it('ledger entries are never created for failed operations', async () => {
    const countBefore = await prisma.ledgerEntry.count()

    await ledgerCreditDebit({
      prisma,
      walletId,
      type: 'DEBIT',
      amountUnits: 999_999_999_999n,
      description: 'Should not create entry',
    }).catch(() => {})

    const countAfter = await prisma.ledgerEntry.count()
    expect(countAfter).toBe(countBefore)
  })
})
