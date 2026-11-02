import { Router } from 'express'
import { register, login, refresh, logout, me } from '../controllers/auth.controller'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/auth'
import { RegisterSchema, LoginSchema } from '@blockcoin/validation'

const router = Router()

router.post('/register', validate(RegisterSchema), register)
router.post('/login', validate(LoginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authenticate, me)

export default router
