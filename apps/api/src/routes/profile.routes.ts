import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { ok, serverError } from '../utils/response'
import { prisma } from '../utils/prisma'
import { validate } from '../middleware/validate'
import { UpdateProfileSchema, ChangePasswordSchema } from '@blockcoin/validation'
import { AuthRequest } from '../middleware/auth'
import { Response } from 'express'
import argon2 from 'argon2'
import { badRequest } from '../utils/response'

const router = Router()

router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    })
    ok(res, user)
  } catch { serverError(res) }
})

router.put('/', validate(UpdateProfileSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: req.body,
      select: { id: true, email: true, firstName: true, lastName: true },
    })
    ok(res, user)
  } catch { serverError(res) }
})

router.put('/password', validate(ChangePasswordSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } })
    if (!user) { badRequest(res, 'User not found'); return }
    const valid = await argon2.verify(user.passwordHash, req.body.currentPassword)
    if (!valid) { badRequest(res, 'Current password incorrect'); return }
    const passwordHash = await argon2.hash(req.body.newPassword, { type: argon2.argon2id })
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    ok(res, null, 'Password updated')
  } catch { serverError(res) }
})

export default router
