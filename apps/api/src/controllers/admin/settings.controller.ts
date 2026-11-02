import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'

export async function getSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const settings = await prisma.systemSetting.findMany()
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
    ok(res, map)
  } catch {
    serverError(res)
  }
}

export async function upsertSetting(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { key, value } = req.body
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    await prisma.adminLog.create({
      data: {
        actorId: req.user!.sub,
        action: 'UPDATE_SETTING',
        targetType: 'SystemSetting',
        targetId: key,
        metadata: { value },
      },
    })
    ok(res, setting)
  } catch {
    serverError(res)
  }
}

export async function getSecurityReports(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))

    const [items, total] = await Promise.all([
      prisma.securityReport.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.securityReport.count(),
    ])

    ok(res, { items, total, page, limit })
  } catch {
    serverError(res)
  }
}
