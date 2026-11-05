import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { z } from 'zod'
import { getDepositAddresses, submitDeposit, listMyDeposits } from '../controllers/deposits.controller'

const router = Router()
router.use(authenticate)

const SubmitDepositSchema = z.object({
  walletId: z.string().min(1),
  network: z.enum(['ETH_ERC20', 'TRON_TRC20']),
  txHash: z.string().min(10),
  amountDisplay: z.string().regex(/^\d+(\.\d{1,6})?$/),
})

router.get('/addresses', getDepositAddresses)
router.get('/', listMyDeposits)
router.post('/', validate(SubmitDepositSchema), submitDeposit)

export default router
