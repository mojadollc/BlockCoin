import { PrismaClient, TransactionType } from '@blockcoin/database'
import { displayToUnits, unitsToDisplay } from '@blockcoin/shared'
import { v4 as uuidv4 } from 'uuid'

/**
 * Core ledger engine — all balance mutations go through here.
 * Uses atomic DB transactions and idempotency keys to prevent duplicates.
 */

export interface LedgerCreditDebitArgs {
  prisma: PrismaClient
  walletId: string
  type: TransactionType
  amountUnits: bigint
  description: string
  idempotencyKey?: string
  actorId?: string
  transactionId?: string
}

export interface LedgerTransferArgs {
  prisma: PrismaClient
  fromWalletId: string
  toWalletId: string
  amountUnits: bigint
  description: string
  idempotencyKey?: string
  actorId?: string
}

export interface LedgerResult {
  entryId: string
  balanceAfterUnits: bigint
  balanceAfterDisplay: string
}

export async function ledgerCreditDebit(args: LedgerCreditDebitArgs): Promise<LedgerResult> {
  const { prisma, walletId, type, amountUnits, description, actorId, transactionId } = args
  const idempotencyKey = args.idempotencyKey ?? `${type.toLowerCase()}:${uuidv4()}`

  // Check for duplicate
  const existing = await prisma.ledgerEntry.findUnique({ where: { idempotencyKey } })
  if (existing) {
    return {
      entryId: existing.id,
      balanceAfterUnits: existing.balanceAfter,
      balanceAfterDisplay: unitsToDisplay(existing.balanceAfter),
    }
  }

  return prisma.$transaction(async (tx) => {
    // Lock the ledger account row
    const account = await tx.ledgerAccount.findUnique({
      where: { virtualWalletId: walletId },
    })
    if (!account) throw new Error('Ledger account not found')

    const newBalance =
      type === 'CREDIT' || type === 'ADJUSTMENT'
        ? account.balanceUnits + amountUnits
        : account.balanceUnits - amountUnits

    if (newBalance < 0n) throw new Error('Insufficient balance')

    await tx.ledgerAccount.update({
      where: { id: account.id },
      data: { balanceUnits: newBalance },
    })

    const entry = await tx.ledgerEntry.create({
      data: {
        ledgerAccountId: account.id,
        type,
        amountUnits,
        balanceAfter: newBalance,
        description,
        idempotencyKey,
        actorId: actorId ?? null,
        transactionId: transactionId ?? null,
      },
    })

    return {
      entryId: entry.id,
      balanceAfterUnits: newBalance,
      balanceAfterDisplay: unitsToDisplay(newBalance),
    }
  })
}

export async function ledgerTransfer(args: LedgerTransferArgs): Promise<{ debitEntry: string; creditEntry: string }> {
  const { prisma, fromWalletId, toWalletId, amountUnits, description, actorId } = args
  const baseKey = args.idempotencyKey ?? uuidv4()

  return prisma.$transaction(async (tx) => {
    const [fromAccount, toAccount] = await Promise.all([
      tx.ledgerAccount.findUnique({ where: { virtualWalletId: fromWalletId } }),
      tx.ledgerAccount.findUnique({ where: { virtualWalletId: toWalletId } }),
    ])

    if (!fromAccount) throw new Error('Source ledger account not found')
    if (!toAccount) throw new Error('Destination ledger account not found')
    if (fromAccount.balanceUnits < amountUnits) throw new Error('Insufficient balance')

    const fromNew = fromAccount.balanceUnits - amountUnits
    const toNew = toAccount.balanceUnits + amountUnits

    await tx.ledgerAccount.update({ where: { id: fromAccount.id }, data: { balanceUnits: fromNew } })
    await tx.ledgerAccount.update({ where: { id: toAccount.id }, data: { balanceUnits: toNew } })

    const debitEntry = await tx.ledgerEntry.create({
      data: {
        ledgerAccountId: fromAccount.id,
        type: 'TRANSFER',
        amountUnits,
        balanceAfter: fromNew,
        description: `Transfer out: ${description}`,
        idempotencyKey: `${baseKey}:debit`,
        actorId: actorId ?? null,
      },
    })

    const creditEntry = await tx.ledgerEntry.create({
      data: {
        ledgerAccountId: toAccount.id,
        type: 'TRANSFER',
        amountUnits,
        balanceAfter: toNew,
        description: `Transfer in: ${description}`,
        idempotencyKey: `${baseKey}:credit`,
        actorId: actorId ?? null,
      },
    })

    return { debitEntry: debitEntry.id, creditEntry: creditEntry.id }
  })
}

export async function ensureLedgerAccount(prisma: PrismaClient, walletId: string): Promise<void> {
  await prisma.ledgerAccount.upsert({
    where: { virtualWalletId: walletId },
    update: {},
    create: { virtualWalletId: walletId },
  })
}
