import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { CreateSimulationSchema } from '@blockcoin/validation'
import {
  listSimulations, getSimulation,
  createUserSimulation, cancelUserSimulation,
} from '../controllers/simulations.controller'

const router = Router()
router.use(authenticate)

router.get('/', listSimulations)
router.post('/', validate(CreateSimulationSchema), createUserSimulation)
router.get('/:id', getSimulation)
router.post('/:id/cancel', cancelUserSimulation)

export default router
