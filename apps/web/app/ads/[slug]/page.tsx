import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VideoPlayer, { CopyUrlButton, CopySnippetButton } from './VideoPlayer'

const SITE_URL = 'https://blockcoin.beegoo.app'
const R2_BASE = 'https://pub-207464b7ca864a90b541ddb8a74af3f9.r2.dev'

const VIDEOS: Record<string, { title: string; description: string; slug: string; r2Key: string }> = {
  'crypto-ads-ambassadors': {
    slug: 'crypto-ads-ambassadors',
    title: 'Crypto Ads Ambassadors',
    description: 'BlockCoin ambassador campaign — join the fastest growing USDT wallet platform.',
    r2Key: 'ads/videos/crypto-ads-ambassadors.mp4',
  },
  'crypto-ads-hype': {
    slug: 'crypto-ads-hype',
    title: 'Crypto Ads Hype',
    description: 'Feel the energy of the BlockCoin movement — USDT wallets for the next generation.',
    r2Key: 'ads/videos/crypto-ads-hype.mp4',
  },
}

export const dynamic = 'force-dynamic'
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const video = VIDEOS[params.slug]
  if (!video) return {}
  const videoUrl = `${R2_BASE}/${video.r2Key}`
  return {
    title: `${video.title} — BlockCoin`,
    description: video.description,
    openGraph: {
      title: `${video.title} — BlockCoin`,
      description: video.description,
      url: `${SITE_URL}/ads/${video.slug}`,
      type: 'video.other',
      videos: [{ url: videoUrl, type: 'video/mp4' }],
    },
    twitter: {
      card: 'player',
      title: `${video.title} — BlockCoin`,
      description: video.description,
    },
  }
}

export default function VideoAdPage({ params }: { params: { slug: string } }) {
  const video = VIDEOS[params.slug]
  if (!video) notFound()
  const videoUrl = `${R2_BASE}/${video.r2Key}`

  const pageUrl = `${SITE_URL}/ads/${video.slug}`
  const trackingUrl = `${SITE_URL}/go?ref=video-embed&creative=${video.slug}&size=video`

  const embedSnippet = `<iframe
  src="${pageUrl}?embed=1"
  width="400"
  height="711"
  frameborder="0"
  allow="autoplay; fullscreen"
  allowfullscreen
  style="border:0;border-radius:24px;overflow:hidden;">
</iframe>`

  return (
    <div className="min-h-screen bg-bg text-surface">

      {/* Nav */}
      <nav className="border-b border-white/5 bg-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-5 h-[60px] flex items-center justify-between">
          <Link href="/" className="font-black text-sm tracking-tight hover:text-primary transition-colors">
            BlockCoin
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/advertise" className="text-xs text-surface/50 hover:text-surface transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
              Media Kit
            </Link>
            <Link href="/register" className="text-xs bg-primary text-bg font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-4 py-1.5 mb-5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#2684FF"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span className="text-secondary text-xs font-bold uppercase tracking-widest">Video Ad</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">{video.title}</h1>
          <p className="text-surface/40 text-sm max-w-xl leading-relaxed">{video.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10 items-start">

          {/* Left — 9:16 video player */}
          <div className="space-y-4">
            {/* Phone frame */}
            <div className="relative mx-auto" style={{ maxWidth: '400px' }}>
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-20 flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="w-8 h-1 rounded-full bg-white/10" />
              </div>
              <VideoPlayer url={videoUrl} title={video.title} trackingUrl={trackingUrl} />
            </div>
          </div>

          {/* Right — info panel */}
          <div className="space-y-4 lg:pt-2">

            {/* Unique URL */}
            <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <p className="text-sm font-bold">Unique Video URL</p>
                <p className="text-xs text-surface/30 mt-0.5">Share this link anywhere — publicly accessible</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="bg-[#0a1018] rounded-xl px-4 py-3">
                  <p className="text-xs font-mono text-primary break-all">{pageUrl}</p>
                </div>
                <CopyUrlButton url={pageUrl} />
              </div>
            </div>

            {/* Embed snippet */}
            <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <p className="text-sm font-bold">Embed on Your Site</p>
                <p className="text-xs text-surface/30 mt-0.5">Paste this iframe into any webpage</p>
              </div>
              <div className="p-5 space-y-3">
                <pre className="text-xs text-surface/40 bg-[#0a1018] rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all font-mono scrollbar-none">
                  {embedSnippet}
                </pre>
                <CopySnippetButton text={embedSnippet} />
              </div>
            </div>

            {/* Tracking info */}
            <div className="bg-card border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F5B942" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <p className="text-sm font-bold">Click Tracking</p>
              </div>
              <p className="text-xs text-surface/40 leading-relaxed mb-3">
                All CTA clicks route through <span className="font-mono text-primary/70">/go</span> with UTM params — track conversions in Google Analytics.
              </p>
              <div className="bg-[#0a1018] rounded-xl px-3 py-2.5">
                <p className="text-xs font-mono text-surface/30 break-all">{trackingUrl}</p>
              </div>
            </div>

            <Link
              href="/advertise"
              className="flex items-center gap-2 text-xs text-surface/40 hover:text-surface transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Media Kit
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 px-5 mt-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-black text-sm hover:text-primary transition-colors">BlockCoin</Link>
          <p className="text-xs text-surface/20" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} BlockCoin. All rights reserved.
          </p>
          <Link href="/advertise" className="text-xs text-surface/30 hover:text-surface transition-colors">Media Kit</Link>
        </div>
      </footer>
    </div>
  )
}
