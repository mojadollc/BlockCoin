import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, created, badRequest, notFound, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'
import argon2 from 'argon2'

export async function listUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
    const search = (req.query.search as string) ?? ''

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, createdAt: true,
          _count: { select: { virtualWallets: true } },
        },
      }),
      prisma.user.count({ where }),
    ])

    ok(res, { items, total, page, limit })
  } catch {
    serverError(res)
  }
}

export async function getUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true,
        virtualWallets: {
          select: {
            id: true, label: true, status: true, createdAt: true,
            ledgerAccount: { select: { balanceUnits: true } },
          },
        },
      },
    })
    if (!user) { notFound(res); return }
    ok(res, user)
  } catch {
    serverError(res)
  }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password, firstName, lastName, role } = req.body

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) { badRequest(res, 'Email already registered'); return }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id })

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email: email.toLowerCase().trim(), passwordHash, firstName, lastName, role: role ?? 'USER' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      })

      // Auto-create a default wallet for the user
      await tx.virtualWallet.create({
        data: { userId: newUser.id, label: 'Main Wallet' },
      })

      await tx.adminLog.create({
        data: { actorId: req.user!.sub, action: 'CREATE_USER', targetType: 'User', targetId: newUser.id },
      })

      return newUser
    })

    created(res, user)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[createUser]', msg)
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      badRequest(res, 'Email already registered')
    } else {
      serverError(res, msg)
    }
  }
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { firstName, lastName, role, isActive } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { firstName, lastName, role, isActive },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    })

    await prisma.adminLog.create({
      data: {
        actorId: req.user!.sub,
        action: 'UPDATE_USER',
        targetType: 'User',
        targetId: user.id,
        metadata: { firstName, lastName, role, isActive },
      },
    })

    ok(res, user)
  } catch {
    serverError(res)
  }
}

export async function suspendUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.params.id === req.user!.sub) { badRequest(res, 'Cannot suspend yourself'); return }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    })

    await prisma.session.deleteMany({ where: { userId: req.params.id } })

    await prisma.adminLog.create({
      data: { actorId: req.user!.sub, action: 'SUSPEND_USER', targetType: 'User', targetId: user.id },
    })

    ok(res, user)
  } catch {
    serverError(res)
  }
}

export async function activateUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
      select: { id: true, email: true, isActive: true },
    })

    await prisma.adminLog.create({
      data: { actorId: req.user!.sub, action: 'ACTIVATE_USER', targetType: 'User', targetId: user.id },
    })

    ok(res, user)
  } catch {
    serverError(res)
  }
}

export async function resetUserPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 8) { badRequest(res, 'Password too short'); return }

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id })
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } })
    await prisma.session.deleteMany({ where: { userId: req.params.id } })

    await prisma.adminLog.create({
      data: { actorId: req.user!.sub, action: 'RESET_PASSWORD', targetType: 'User', targetId: req.params.id },
    })

    ok(res, null, 'Password reset')
  } catch {
    serverError(res)
  }
}
