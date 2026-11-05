import { Request, Response, NextFunction } from 'express'
import { verifyAccess } from '../utils/jwt'
import { unauthorized, forbidden } from '../utils/response'
import { Role, PermissionFeature, PermissionLevel, TokenPayload } from '@blockcoin/shared'
import { prisma } from '../utils/prisma'

export interface AuthRequest extends Request {
  user?: TokenPayload
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.access_token as string | undefined
  if (!token) { unauthorized(res); return }

  try {
    req.user = verifyAccess(token)
    next()
  } catch {
    unauthorized(res)
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      forbidden(res)
      return
    }
    next()
  }
}

/** Allow ADMIN always. Allow SUB_ADMIN only if they have the required permission level. */
export function requirePermission(feature: PermissionFeature, level: PermissionLevel = 'READ') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) { unauthorized(res); return }
    if (req.user.role === 'ADMIN') { next(); return }
    if (req.user.role !== 'SUB_ADMIN') { forbidden(res); return }

    const perm = await prisma.subAdminPermission.findUnique({
      where: { userId_feature: { userId: req.user.sub, feature } },
    })

    if (!perm) { forbidden(res); return }
    if (level === 'WRITE' && perm.level !== 'WRITE') { forbidden(res); return }

    next()
  }
}
