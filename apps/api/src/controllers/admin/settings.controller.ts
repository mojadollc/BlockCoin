import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, badRequest, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'
import fs from 'fs'
import path from 'path'

const MANAGEABLE_KEYS = [
  'SEPOLIA_RPC_URL',
  'SEPOLIA_USDT_CONTRACT',
  'TRON_NILE_URL',
  'TRON_NILE_API_KEY',
  'TRON_NILE_USDT_CONTRACT',
  'JWT_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN',
  'API_PORT',
  'API_URL',
  'NODE_ENV',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_WS_URL',
]
const SECRET_KEYS = ['JWT_SECRET', 'REFRESH_TOKEN_SECRET']
const ALL_EDITABLE = [...MANAGEABLE_KEYS, ...SECRET_KEYS]

const UI_FLAGS = ['show_wallet_notice', 'show_simulation_notice', 'show_env_badge'] as const
type UIFlag = typeof UI_FLAGS[number]

function envFilePath() {
  return path.resolve(process.cwd(), '../../.env')
}

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const idx = t.indexOf('=')
    if (idx === -1) continue
    const k = t.slice(0, idx).trim()
    let v = t.slice(idx + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    result[k] = v
  }
  return result
}

function writeEnvKey(filePath: string, key: string, value: string) {
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
  const escaped = value.includes('"') ? `'${value}'` : `"${value}"`
  const regex = new RegExp(`^${key}=.*$`, 'm')
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${escaped}`)
  } else {
    content = content.trimEnd() + `\n${key}=${escaped}\n`
  }
  fs.writeFileSync(filePath, content, 'utf8')
}

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

export async function getEnvKeys(req: AuthRequest, res: Response): Promise<void> {
  try {
    const filePath = envFilePath()
    const fileVals = fs.existsSync(filePath) ? parseEnv(fs.readFileSync(filePath, 'utf8')) : {}
    const result: Record<string, { value: string; isSecret: boolean }> = {}
    for (const key of ALL_EDITABLE) {
      result[key] = {
        value: fileVals[key] ?? process.env[key] ?? '',
        isSecret: SECRET_KEYS.includes(key),
      }
    }
    ok(res, result)
  } catch {
    serverError(res)
  }
}

export async function updateEnvKey(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { key, value } = req.body
    if (!ALL_EDITABLE.includes(key)) {
      badRequest(res, 'Key not allowed')
      return
    }
    const filePath = envFilePath()
    writeEnvKey(filePath, key, String(value))
    process.env[key] = String(value)
    await prisma.adminLog.create({
      data: {
        actorId: req.user!.sub,
        action: 'UPDATE_ENV_KEY',
        targetType: 'EnvKey',
        targetId: key,
        metadata: { key, updated: true },
      },
    })
    ok(res, { key, updated: true })
  } catch {
    serverError(res)
  }
}

// UI flags — readable by anyone (no auth), writable by admin only
export async function getUIFlags(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const rows = await prisma.systemSetting.findMany({
      where: { key: { in: [...UI_FLAGS] } },
    })
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]))
    // default all to 'true' if not set
    const flags: Record<UIFlag, boolean> = {
      show_wallet_notice: (map['show_wallet_notice'] ?? 'true') === 'true',
      show_simulation_notice: (map['show_simulation_notice'] ?? 'true') === 'true',
      show_env_badge: (map['show_env_badge'] ?? 'true') === 'true',
    }
    ok(res, flags)
  } catch {
    serverError(res)
  }
}

export async function updateUIFlag(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { flag, value } = req.body
    if (!UI_FLAGS.includes(flag as UIFlag)) {
      badRequest(res, 'Unknown flag')
      return
    }
    const strVal = String(value) === 'true' ? 'true' : 'false'
    await prisma.systemSetting.upsert({
      where: { key: flag },
      update: { value: strVal },
      create: { key: flag, value: strVal },
    })
    await prisma.adminLog.create({
      data: {
        actorId: req.user!.sub,
        action: 'UPDATE_UI_FLAG',
        targetType: 'UIFlag',
        targetId: flag,
        metadata: { flag, value: strVal },
      },
    })
    ok(res, { flag, value: strVal === 'true' })
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
