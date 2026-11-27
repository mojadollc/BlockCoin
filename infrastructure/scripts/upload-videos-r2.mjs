#!/usr/bin/env node
/**
 * upload-videos-r2.mjs
 * Uploads BlockCoin ad videos to Cloudflare R2
 *
 * Usage:
 *   node infrastructure/scripts/upload-videos-r2.mjs
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

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('\n❌  Missing R2 env vars. Need: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME\n')
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
    envKey: 'NEXT_PUBLIC_VIDEO_CRYPTO_ADS_AMBASSADORS',
  },
  {
    localPath: 'D:/video/Crypto-Ads hype.mp4',
    key: 'ads/videos/crypto-ads-hype.mp4',
    slug: 'crypto-ads-hype',
    title: 'Crypto Ads Hype',
    envKey: 'NEXT_PUBLIC_VIDEO_CRYPTO_ADS_HYPE',
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
    console.log(`✓  Already exists: ${video.key}`)
    return video.key
  } catch {
    // Not found — proceed
  }

  const fileSize = readFileSync(video.localPath).length
  console.log(`⬆  Uploading: ${basename(video.localPath)} (${(fileSize / 1024 / 1024).toFixed(1)} MB) ...`)

  const body = readFileSync(video.localPath)
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: video.key,
    Body: body,
    ContentType: 'video/mp4',
    CacheControl: 'public, max-age=31536000, immutable',
    Metadata: { title: video.title, slug: video.slug },
  }))

  console.log(`✅  Uploaded: ${video.key}`)
  return video.key
}

console.log('\n🚀  BlockCoin — Cloudflare R2 Video Upload')
console.log(`   Bucket   : ${R2_BUCKET_NAME}`)
console.log(`   Endpoint : https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com\n`)

const results = []
for (const video of VIDEOS) {
  const key = await upload(video)
  if (key) results.push({ ...video, key })
}

if (results.length) {
  const publicBase = R2_PUBLIC_URL
    ? R2_PUBLIC_URL.replace(/\/$/, '')
    : `https://pub-XXXXXXXX.r2.dev`

  console.log('\n✅  Upload complete!\n')
  console.log('📋  Add these to your .env on the VPS:\n')
  for (const r of results) {
    console.log(`   ${r.envKey}="${publicBase}/${r.key}"`)
  }

  if (!R2_PUBLIC_URL) {
    console.log('\n⚠️   R2_PUBLIC_URL not set yet.')
    console.log('    1. Go to Cloudflare → R2 → blockcoin bucket → Settings → Public Access')
    console.log('    2. Enable public access — copy the r2.dev URL')
    console.log('    3. Add R2_PUBLIC_URL to .env, then re-run this script for final URLs\n')
  }
}
