import { Router, Request, Response } from 'express'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const router = Router()

const VALID_SLUGS = ['crypto-ads-ambassadors', 'crypto-ads-hype']
const DATA_DIR = join(process.cwd(), 'data', 'ads')

function getLikesFile(slug: string) {
  return join(DATA_DIR, `${slug}-likes.json`)
}

function loadLikes(slug: string): { count: number; ips: string[] } {
  const file = getLikesFile(slug)
  if (!existsSync(file)) return { count: 0, ips: [] }
  try { return JSON.parse(readFileSync(file, 'utf8')) }
  catch { return { count: 0, ips: [] } }
}

function saveLikes(slug: string, data: { count: number; ips: string[] }) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(getLikesFile(slug), JSON.stringify(data))
}

function getIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

// GET /api/v1/ads/:slug/likes
router.get('/:slug/likes', (req: Request, res: Response) => {
  const { slug } = req.params
  if (!VALID_SLUGS.includes(slug)) return res.status(404).json({ error: 'Not found' })
  const data = loadLikes(slug)
  res.json({ count: data.count })
})

// POST /api/v1/ads/:slug/like
router.post('/:slug/like', (req: Request, res: Response) => {
  const { slug } = req.params
  if (!VALID_SLUGS.includes(slug)) return res.status(404).json({ error: 'Not found' })
  const ip = getIP(req)
  const data = loadLikes(slug)
  const alreadyLiked = data.ips.includes(ip)
  if (!alreadyLiked) {
    data.count += 1
    data.ips.push(ip)
    saveLikes(slug, data)
  }
  res.json({ count: data.count, alreadyLiked })
})

export default router
