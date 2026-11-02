import jwt from 'jsonwebtoken'
import { TokenPayload } from '@blockcoin/shared'

const ACCESS_SECRET = process.env.JWT_SECRET!
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET!
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN ?? '15m'
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d'

export function signAccess(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions)
}

export function signRefresh(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions)
}

export function verifyAccess(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload
}

export function verifyRefresh(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload
}
