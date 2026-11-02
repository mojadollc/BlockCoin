import { ApiResponse } from '@blockcoin/shared'
import { Response } from 'express'

export function ok<T>(res: Response, data: T, message?: string): void {
  const body: ApiResponse<T> = { success: true, data, message }
  res.json(body)
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json({ success: true, data })
}

export function badRequest(res: Response, error: string): void {
  res.status(400).json({ success: false, error })
}

export function unauthorized(res: Response, error = 'Unauthorized'): void {
  res.status(401).json({ success: false, error })
}

export function forbidden(res: Response, error = 'Forbidden'): void {
  res.status(403).json({ success: false, error })
}

export function notFound(res: Response, error = 'Not found'): void {
  res.status(404).json({ success: false, error })
}

export function serverError(res: Response, error = 'Internal server error'): void {
  res.status(500).json({ success: false, error })
}
