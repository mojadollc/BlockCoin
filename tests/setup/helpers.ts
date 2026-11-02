import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import { signAccess } from '../../apps/api/src/utils/jwt'

export const prisma = new PrismaClient()

export async function createTestUser(overrides: {
  email?: string
  password?: string
  role?: 'ADMIN' | 'USER'
  isActive?: boolean
} = {}) {
  const email = overrides.email ?? `test-${Date.now()}@blockcoin.test`
  const passwordHash = await argon2.hash(overrides.password ?? 'TestPass1!', { type: argon2.argon2id })

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: overrides.role ?? 'USER',
      isActive: overrides.isActive ?? true,
    },
  })
}

export function authCookie(userId: string, email: string, role: 'ADMIN' | 'USER' = 'USER'): string {
  const token = signAccess({ sub: userId, email, role })
  return `access_token=${token}`
}

export async function createTestWallet(userId: string, label = 'Test Wallet') {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.virtualWallet.create({ data: { userId, label } })
    await tx.ledgerAccount.create({ data: { virtualWalletId: wallet.id } })
    return wallet
  })
}

export async function creditWallet(walletId: string, amountUnits: bigint) {
  const account = await prisma.ledgerAccount.findUnique({ where: { virtualWalletId: walletId } })
  if (!account) throw new Error('No ledger account')
  const newBalance = account.balanceUnits + amountUnits
  await prisma.$transaction([
    prisma.ledgerAccount.update({ where: { id: account.id }, data: { balanceUnits: newBalance } }),
    prisma.ledgerEntry.create({
      data: {
        ledgerAccountId: account.id,
        type: 'CREDIT',
        amountUnits,
        balanceAfter: newBalance,
        description: 'Test credit',
        idempotencyKey: `test:credit:${Date.now()}:${Math.random()}`,
      },
    }),
  ])
  return newBalance
}

export async function cleanupUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } }).catch(() => {})
}

export async function cleanupWallet(walletId: string) {
  await prisma.virtualWallet.delete({ where: { id: walletId } }).catch(() => {})
}
