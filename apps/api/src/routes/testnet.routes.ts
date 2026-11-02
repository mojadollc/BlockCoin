import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  getNetworkInfo, getTokenInfo, getWalletBalance,
  submitTransaction, getReceipt,
  listTestnetTransactions, getTestnetTransaction,
} from '../controllers/testnet.controller'

const router = Router()
router.use(authenticate)

// Network & token info (read-only, no private key needed)
router.get('/:network/info', getNetworkInfo)
router.get('/:network/token', getTokenInfo)
router.get('/:network/balance', getWalletBalance)

// Transaction submission (requires private key in body — never stored)
router.post('/:network/send', submitTransaction)

// Receipt & verification
router.get('/:network/receipt/:txHash', getReceipt)

// History
router.get('/transactions', listTestnetTransactions)
router.get('/transactions/:id', getTestnetTransaction)

export default router
