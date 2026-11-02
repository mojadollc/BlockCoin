import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { listTransactions, getTransaction } from '../controllers/transactions.controller'

const router = Router()
router.use(authenticate)

router.get('/', listTransactions)
router.get('/:id', getTransaction)

export default router
