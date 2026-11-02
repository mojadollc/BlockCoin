import { Request, Response, NextFunction } from 'express'
import { prisma } from '../utils/prisma'
import { AuthRequest } from './auth'

export async function auditLog(action: string, targetType?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    next()
    if (req.user) {
      const targetId = req.params.id ?? req.params.walletId ?? undefined
      await prisma.adminLog.create({
        data: {
          actorId: req.user.sub,
          action,
          targetType,
          targetId,
          metadata: req.body ?? null,
          ipAddress: req.ip,
        },
      }).catch(() => {})
    }
  }
}
