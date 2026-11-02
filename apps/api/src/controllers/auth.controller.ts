import { Request, Response } from 'express'
import argon2 from 'argon2'
import { prisma } from '../utils/prisma'
import { signAccess, signRefresh, verifyRefresh } from '../utils/jwt'
import { ok, created, badRequest, unauthorized, serverError } from '../utils/response'
import { TokenPayload } from '@blockcoin/shared'
import { AuthRequest } from '../middleware/auth'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, firstName, lastName } = req.body
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) { badRequest(res, 'Email already registered'); return }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id })
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    })
    created(res, user)
  } catch (e) {
    serverError(res)
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) { unauthorized(res, 'Invalid credentials'); return }

    const valid = await argon2.verify(user.passwordHash, password)
    if (!valid) { unauthorized(res, 'Invalid credentials'); return }

    const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role }
    const accessToken = signAccess(payload)
    const refreshToken = signRefresh(payload)

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res
      .cookie('access_token', accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 })
      .cookie('refresh_token', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 })

    ok(res, { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role })
  } catch (e) {
    serverError(res)
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.refresh_token as string | undefined
    if (!token) { unauthorized(res); return }

    const payload = verifyRefresh(token)
    const session = await prisma.session.findUnique({ where: { refreshToken: token } })
    if (!session || session.expiresAt < new Date()) { unauthorized(res); return }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.isActive) { unauthorized(res); return }

    const newPayload: TokenPayload = { sub: user.id, email: user.email, role: user.role }
    const newAccess = signAccess(newPayload)

    res.cookie('access_token', newAccess, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 })
    ok(res, { refreshed: true })
  } catch {
    unauthorized(res)
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refresh_token as string | undefined
  if (token) {
    await prisma.session.deleteMany({ where: { refreshToken: token } }).catch(() => {})
  }
  res.clearCookie('access_token').clearCookie('refresh_token')
  ok(res, null, 'Logged out')
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    })
    if (!user) { unauthorized(res); return }
    ok(res, user)
  } catch {
    serverError(res)
  }
}
