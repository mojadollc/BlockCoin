import { Request, Response, NextFunction } from 'express'
import { verifyAccess } from '../utils/jwt'
import { unauthorized, forbidden } from '../utils/response'
import { Role, TokenPayload } from '@blockcoin/shared'

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
