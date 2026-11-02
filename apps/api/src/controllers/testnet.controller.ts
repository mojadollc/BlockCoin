import { Response } from 'express'
import { prisma } from '../utils/prisma'
import { ok, badRequest, notFound, serverError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import * as sepolia from '../services/sepolia.service'
import * as tron from '../services/tron.service'
import * as ethMainnet from '../services/eth-mainnet.service'
import * as tronMainnet from '../services/tron-mainnet.service'
import { z } from 'zod'

// ── Network info ─────────────────────────────────────────────────────────────

export async function getNetworkInfo(req: AuthRequest, res: Response): Promise<void> {
  const { network } = req.params
  try {
    if (network === 'sepolia') ok(res, await sepolia.getNetworkInfo())
    else if (network === 'tron-nile') ok(res, tron.getNetworkInfo())
    else if (network === 'eth-mainnet') ok(res, await ethMainnet.getNetworkInfo())
    else if (network === 'tron-mainnet') ok(res, tronMainnet.getNetworkInfo())
    else badRequest(res, 'Unknown network. Use: sepolia | tron-nile | eth-mainnet | tron-mainnet')
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Failed to get network info')
  }
}

export async function getTokenInfo(req: AuthRequest, res: Response): Promise<void> {
  const { network } = req.params
  try {
    if (network === 'sepolia') ok(res, await sepolia.getTokenInfo())
    else if (network === 'tron-nile') ok(res, await tron.getTokenInfo())
    else if (network === 'eth-mainnet') ok(res, await ethMainnet.getTokenInfo())
    else if (network === 'tron-mainnet') ok(res, await tronMainnet.getTokenInfo())
    else badRequest(res, 'Unknown network')
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Failed to get token info')
  }
}

// ── Wallet balance ────────────────────────────────────────────────────────────

export async function getWalletBalance(req: AuthRequest, res: Response): Promise<void> {
  const { network } = req.params
  const { address } = req.query as { address: string }

  if (!address) { badRequest(res, 'address query param required'); return }

  try {
    if (network === 'sepolia') ok(res, await sepolia.getWalletBalance(address))
    else if (network === 'tron-nile') ok(res, await tron.getWalletBalance(address))
    else if (network === 'eth-mainnet') ok(res, await ethMainnet.getWalletBalance(address))
    else if (network === 'tron-mainnet') ok(res, await tronMainnet.getWalletBalance(address))
    else badRequest(res, 'Unknown network')
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Failed to get balance')
  }
}

// ── Submit transaction ────────────────────────────────────────────────────────

const SubmitSchema = z.object({
  privateKey: z.string().min(1),
  toAddress: z.string().min(1),
  amountDisplay: z.string().regex(/^\d+(\.\d{1,6})?$/),
})

export async function submitTransaction(req: AuthRequest, res: Response): Promise<void> {
  const { network } = req.params
  const parsed = SubmitSchema.safeParse(req.body)
  if (!parsed.success) { badRequest(res, parsed.error.errors[0].message); return }

  const { privateKey, toAddress, amountDisplay } = parsed.data

  try {
    // Convert display amount to units (6 decimals for USDT)
    const [whole, frac = ''] = amountDisplay.split('.')
    const fracPadded = frac.padEnd(6, '0').slice(0, 6)
    const amountUnits = BigInt(whole + fracPadded)

    let result: sepolia.SubmitTxResult | tron.TronSubmitResult

    if (network === 'sepolia') {
      result = await sepolia.submitTransfer(privateKey, toAddress, amountUnits)
    } else if (network === 'tron-nile') {
      result = await tron.submitTransfer(privateKey, toAddress, amountUnits)
    } else {
      badRequest(res, 'Unknown network'); return
    }

    // Persist to testnet_transactions — separate from internal records
    const dbNetwork = network === 'sepolia' ? 'SEPOLIA' : 'TRON_NILE'
    const record = await prisma.testnetTransaction.create({
      data: {
        network: dbNetwork,
        txHash: result.txHash,
        fromAddress: result.fromAddress,
        toAddress: result.toAddress,
        amountUnits: result.amountUnits,
        tokenSymbol: 'USDT',
        status: 'PENDING',
        userId: req.user!.sub,
      },
    })

    ok(res, {
      ...result,
      recordId: record.id,
      note: 'This is a real testnet transaction. Verify independently on a blockchain explorer.',
    })
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Transaction failed')
  }
}

// ── Receipt / verification ────────────────────────────────────────────────────

export async function getReceipt(req: AuthRequest, res: Response): Promise<void> {
  const { network, txHash } = req.params

  try {
    let receipt: sepolia.TxReceipt | tron.TronTxReceipt

    if (network === 'sepolia') receipt = await sepolia.getTransactionReceipt(txHash)
    else if (network === 'tron-nile') receipt = await tron.getTransactionReceipt(txHash)
    else if (network === 'eth-mainnet') receipt = await ethMainnet.getTransactionReceipt(txHash)
    else if (network === 'tron-mainnet') receipt = await tronMainnet.getTransactionReceipt(txHash)
    else { badRequest(res, 'Unknown network'); return }

    // Update our DB record if we have one
    const dbNetwork = network === 'sepolia' ? 'SEPOLIA' : 'TRON_NILE'
    const existing = await prisma.testnetTransaction.findFirst({
      where: { txHash, network: dbNetwork },
    })

    if (existing) {
      await prisma.testnetTransaction.update({
        where: { id: existing.id },
        data: {
          blockNumber: receipt.blockNumber ? BigInt(receipt.blockNumber) : null,
          confirmations: receipt.confirmations,
          status: receipt.status,
        },
      })
    }

    ok(res, receipt)
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Failed to get receipt')
  }
}

// ── Transaction history ───────────────────────────────────────────────────────

export async function listTestnetTransactions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)))
    const network = req.query.network as string | undefined

    const where: Record<string, unknown> = { userId }
    if (network === 'sepolia') where.network = 'SEPOLIA'
    if (network === 'tron-nile') where.network = 'TRON_NILE'

    const [items, total] = await Promise.all([
      prisma.testnetTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.testnetTransaction.count({ where }),
    ])

    // Serialize BigInt fields
    const mapped = items.map(t => ({
      ...t,
      amountUnits: t.amountUnits.toString(),
      blockNumber: t.blockNumber?.toString() ?? null,
    }))

    ok(res, { items: mapped, total, page, limit })
  } catch {
    serverError(res)
  }
}

export async function getTestnetTransaction(req: AuthRequest, res: Response): Promise<void> {
  try {
    const tx = await prisma.testnetTransaction.findUnique({ where: { id: req.params.id } })
    if (!tx) { notFound(res); return }
    if (tx.userId !== req.user!.sub) { badRequest(res, 'Forbidden'); return }

    ok(res, {
      ...tx,
      amountUnits: tx.amountUnits.toString(),
      blockNumber: tx.blockNumber?.toString() ?? null,
    })
  } catch {
    serverError(res)
  }
}
