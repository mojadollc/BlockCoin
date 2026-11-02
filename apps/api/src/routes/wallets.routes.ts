import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { CreateWalletSchema } from '@blockcoin/validation'
import { z } from 'zod'
import {
  listWallets, createWallet, getWallet, getBalance,
  deposit, withdraw, transfer, getLedgerHistory,
} from '../controllers/wallets.controller'

const router = Router()
router.use(authenticate)

const AmountSchema = z.object({
  amountDisplay: z.string().regex(/^\d+(\.\d{1,6})?$/),
  description: z.string().max(200).optional(),
})

const TransferSchema = AmountSchema.extend({
  toWalletId: z.string().min(1),
})

router.get('/', listWallets)
router.post('/', validate(CreateWalletSchema), createWallet)
router.get('/:id', getWallet)
router.get('/:id/balance', getBalance)
router.post('/:id/deposit', validate(AmountSchema), deposit)
router.post('/:id/withdraw', validate(AmountSchema), withdraw)
router.post('/:id/transfer', validate(TransferSchema), transfer)
router.get('/:id/history', getLedgerHistory)

export default router
