#!/usr/bin/env node
/**
 * upload-videos-r2.mjs
 * Uploads BlockCoin ad videos to Cloudflare R2
 *
 * Usage:
 *   node infrastructure/scripts/upload-videos-r2.mjs
 *
 * Required env vars (add to .env):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
 *   R2_BUCKET_NAME, R2_PUBLIC_URL
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync, existsSync } from 'fs'
import { resolve, basename } from 'path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env') })

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} = process.env

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
  console.error('\n❌  Missing R2 env vars. Add these to your .env:\n')
  console.error('   R2_ACCOUNT_ID=your-cloudflare-account-id')
  console.error('   R2_ACCESS_KEY_ID=your-r2-access-key-id')
  console.error('   R2_SECRET_ACCESS_KEY=your-r2-secret-access-key')
  console.error('   R2_BUCKET_NAME=your-bucket-name')
  console.error('   R2_PUBLIC_URL=https://your-bucket.your-subdomain.r2.dev\n')
  process.exit(1)
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

const VIDEOS = [
  {
    localPath: 'D:/video/CryptoAdsAmbassadors.mp4',
    key: 'ads/videos/crypto-ads-ambassadors.mp4',
    slug: 'crypto-ads-ambassadors',
    title: 'Crypto Ads Ambassadors',
  },
  {
    localPath: 'D:/video/Crypto-Ads hype.mp4',
    key: 'ads/videos/crypto-ads-hype.mp4',
    slug: 'crypto-ads-hype',
    title: 'Crypto Ads Hype',
  },
]

async function upload(video) {
  if (!existsSync(video.localPath)) {
    console.error(`❌  File not found: ${video.localPath}`)
    return null
  }

  // Check if already uploaded
  try {
    await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: video.key }))
    const url = `${R2_PUBLIC_URL}/${video.key}`
    console.log(`✓  Already exists: ${video.key}`)
    console.log(`   URL: ${url}\n`)
    return url
  } catch {
    // Not found — proceed with upload
  }

  console.log(`⬆  Uploading: ${basename(video.localPath)} ...`)
  const body = readFileSync(video.localPath)

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: video.key,
    Body: body,
    ContentType: 'video/mp4',
    CacheControl: 'public, max-age=31536000, immutable',
    Metadata: {
      title: video.title,
      slug: video.slug,
    },
  }))

  const url = `${R2_PUBLIC_URL}/${video.key}`
  console.log(`✅  Uploaded: ${video.key}`)
  console.log(`   Public URL: ${url}\n`)
  return url
}

console.log('\n🚀  BlockCoin — Cloudflare R2 Video Upload\n')
console.log(`   Bucket : ${R2_BUCKET_NAME}`)
console.log(`   Public : ${R2_PUBLIC_URL}\n`)

const results = []
for (const video of VIDEOS) {
  const url = await upload(video)
  if (url) results.push({ ...video, url })
}

if (results.length) {
  console.log('\n📋  Add these to your .env:\n')
  for (const r of results) {
    const envKey = `NEXT_PUBLIC_VIDEO_${r.slug.toUpperCase().replace(/-/g, '_')}`
    console.log(`   ${envKey}="${r.url}"`)
  }
  console.log()
}
