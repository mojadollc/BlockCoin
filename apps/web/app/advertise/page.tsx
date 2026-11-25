'use client'

import Link from 'next/link'
import { useState } from 'react'

const SITE_URL = 'https://blockcoin.beegoo.app'

function buildTrackingUrl(creativeId: number, size: string, ref = 'YOUR-SITE.COM') {
  const params = new URLSearchParams({
    ref,
    creative: String(creativeId),
    size,
  })
  return `${SITE_URL}/go?${params.toString()}`
}

const CREATIVES = [
  {
    id: 1,
    file: '/ads-img/blockcoin-ad.png',
    download: 'blockcoin-ad.png',
    label: 'Think Bigger',
    sublabel: 'USDT Investment Opportunities',
    type: 'PNG' as const,
  },
  {
    id: 2,
    file: '/ads-img/blockcoin-ad-2.gif',
    download: 'blockcoin-ad-2.gif',
    label: '30 Days to Crypto Cheer',
    sublabel: 'Animated Campaign',
    type: 'GIF' as const,
  },
  {
    id: 3,
    file: '/ads-img/blockcoin-ad-3.gif',
    download: 'blockcoin-ad-3.gif',
    label: '30-Day USDT Journey',
    sublabel: 'Animated Investment Series',
    type: 'GIF' as const,
  },
  {
    id: 4,
    file: '/ads-img/blockcoin-ad-4.png',
    download: 'blockcoin-ad-4.png',
    label: 'BlockCoin Visual',
    sublabel: 'Brand Creative',
    type: 'PNG' as const,
  },
  {
    id: 5,
    file: '/ads-img/blockcoin-ad-5.gif',
    download: 'blockcoin-ad-5.gif',
    label: 'The Future Is Digital',
    sublabel: 'USDT Journey Animated',
    type: 'GIF' as const,
  },
]

const AD_SIZES = [
  { label: 'Medium Rectangle', width: 300, height: 250, popular: true },
  { label: 'Leaderboard', width: 728, height: 90, popular: true },
  { label: 'Large Rectangle', width: 336, height: 280, popular: false },
  { label: 'Half Page', width: 300, height: 600, popular: false },
  { label: 'Billboard', width: 970, height: 250, popular: false },
  { label: 'Wide Skyscraper', width: 160, height: 600, popular: false },
  { label: 'Mobile Banner', width: 320, height: 50, popular: false },
  { label: 'Square', width: 250, height: 250, popular: false },
]

function buildSnippet(imageUrl: string, width: number, height: number, creativeId: number) {
  const src = `${SITE_URL}${imageUrl}`
  const trackingUrl = buildTrackingUrl(creativeId, `${width}x${height}`)
  return `<a href="${trackingUrl}" target="_blank" rel="noopener sponsored" style="display:inline-block;width:${width}px;height:${height}px;overflow:hidden;">
  <img src="${src}" alt="BlockCoin — USDT Wallet Platform" width="${width}" height="${height}" style="width:${width}px;height:${height}px;object-fit:cover;border:0;" />
</a>`
}

function CopyButton({ text, full }: { text: string; full?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }}
      className={`flex items-center gap-2 font-bold transition-all rounded-xl ${
        full ? 'w-full justify-center py-3 text-sm' : 'px-5 py-2.5 text-xs'
      } ${
        copied
          ? 'bg-primary/15 text-primary border border-primary/30'
          : 'bg-white/6 border border-white/10 text-surface/70 hover:bg-white/10 hover:text-surface hover:border-white/20'
      }`}
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
          Copy Code
        </>
      )}
    </button>
  )
}

function Lightbox({ file, label, onClose }: { file: string; label: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
          <span className="text-sm font-bold">{label}</span>
          <button onClick={onClose} className="text-surface/40 hover:text-surface transition-colors text-lg leading-none">✕</button>
        </div>
        <div className="bg-bg/60 flex items-center justify-center p-6 min-h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file} alt={label} style={{ maxWidth: '100%', maxHeight: '70vh', width: 'auto', height: 'auto' }} />
        </div>
      </div>
    </div>
  )
}

function CreativeCard({
  creative,
  isActive,
  onClick,
}: {
  creative: typeof CREATIVES[0]
  isActive: boolean
  onClick: () => void
}) {
  const isGif = creative.type === 'GIF'
  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden ${
        isActive
          ? 'border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/20'
          : 'border-white/5 hover:border-white/15 hover:shadow-lg hover:shadow-black/30'
      }`}
    >
      {/* Image preview */}
      <div className="relative bg-bg h-40 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creative.file}
          alt={creative.label}
          style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
        />
        {/* Hover overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-bold text-white">
            Select
          </div>
        </div>
        {/* Active check */}
        {isActive && (
          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#101820" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
        )}
      </div>
      {/* Info */}
      <div className={`px-3.5 py-3 border-t transition-colors ${isActive ? 'bg-primary/5 border-primary/20' : 'bg-card border-white/5'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">{creative.label}</p>
            <p className="text-xs text-surface/30 truncate mt-0.5">{creative.sublabel}</p>
          </div>
          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-md mt-0.5 ${
            isGif ? 'bg-secondary/15 text-secondary' : 'bg-primary/15 text-primary'
          }`}>
            {isGif ? 'GIF' : 'PNG'}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function AdvertisePage() {
  const [activeCreative, setActiveCreative] = useState(0)
  const [activeSize, setActiveSize] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const creative = CREATIVES[activeCreative]
  const size = AD_SIZES[activeSize]
  const trackingUrl = buildTrackingUrl(creative.id, `${size.width}x${size.height}`)
  const snippet = buildSnippet(creative.file, size.width, size.height, creative.id)

  return (
    <div className="min-h-screen bg-bg text-surface">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-bg/75 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-15 h-[60px] flex items-center justify-between">
          <Link href="/" className="font-black text-sm tracking-tight hover:text-primary transition-colors">
            BlockCoin
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-xs text-surface/50 hover:text-surface transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
              Sign In
            </Link>
            <Link href="/register" className="text-xs bg-primary text-bg font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 px-5 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/6 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-xs font-bold uppercase tracking-widest">Media Kit</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-5">
              Advertise with<br />
              <span className="text-primary">BlockCoin</span>
            </h1>
            <p className="text-surface/40 text-base leading-relaxed max-w-lg">
              Reach a growing audience of crypto investors and USDT users. Copy an embed snippet and place our ad on your website in under a minute.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-8 mt-10 pt-10 border-t border-white/5">
            {[
              { value: '5', label: 'Ad Creatives', sub: '3 animated GIFs' },
              { value: '8', label: 'Standard Sizes', sub: 'All IAB formats' },
              { value: '1min', label: 'To Integrate', sub: 'Copy & paste HTML' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-black text-primary tabular-nums">{s.value}</p>
                <p className="text-sm font-semibold mt-0.5">{s.label}</p>
                <p className="text-xs text-surface/30 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <section className="px-5 pb-20">
        <div className="max-w-6xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">

            {/* LEFT — Creative gallery + size picker */}
            <div className="space-y-8">

              {/* Creative gallery */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-surface/60 uppercase tracking-widest">Choose Creative</h2>
                  <span className="text-xs text-surface/30">{activeCreative + 1} of {CREATIVES.length} selected</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {CREATIVES.map((c, i) => (
                    <CreativeCard
                      key={c.id}
                      creative={c}
                      isActive={activeCreative === i}
                      onClick={() => setActiveCreative(i)}
                    />
                  ))}
                </div>
              </div>

              {/* Size picker */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-surface/60 uppercase tracking-widest">Choose Size</h2>
                  <span className="text-xs text-surface/30">{size.width} × {size.height} px</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AD_SIZES.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => setActiveSize(i)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                        activeSize === i
                          ? 'bg-primary/8 border-primary/40 text-surface'
                          : 'bg-card border-white/5 text-surface/60 hover:border-white/15 hover:text-surface'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Visual size indicator */}
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                          <div
                            className={`rounded-sm transition-colors ${activeSize === i ? 'bg-primary/40' : 'bg-white/10'}`}
                            style={{
                              width: `${Math.round(Math.min(s.width / 970, 1) * 28 + 4)}px`,
                              height: `${Math.round(Math.min(s.height / 600, 1) * 20 + 4)}px`,
                              minWidth: '4px',
                              minHeight: '4px',
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{s.label}</p>
                          {s.popular && (
                            <p className="text-xs text-primary/70 font-semibold">Most popular</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs tabular-nums font-mono ${activeSize === i ? 'text-primary' : 'text-surface/30'}`}>
                        {s.width}×{s.height}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Preview + Snippet panel (sticky) */}
            <div className="lg:sticky lg:top-20 space-y-4">

              {/* Live preview card */}
              <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">{creative.label}</p>
                    <p className="text-xs text-surface/30 mt-0.5">{creative.sublabel}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    creative.type === 'GIF'
                      ? 'bg-secondary/15 text-secondary'
                      : 'bg-primary/15 text-primary'
                  }`}>
                    {creative.type === 'GIF' ? '▶ Animated' : '◼ Static'}
                  </span>
                </div>

                {/* Preview */}
                <div
                  className="relative bg-[#0a1018] flex items-center justify-center cursor-zoom-in group"
                  style={{ minHeight: '220px' }}
                  onClick={() => setLightbox(true)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={creative.file}
                    alt={creative.label}
                    style={{ maxWidth: '100%', maxHeight: '280px', width: 'auto', height: 'auto', display: 'block' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-bold flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                      View Full Size
                    </div>
                  </div>
                </div>

                {/* Download row */}
                <div className="px-5 py-4 border-t border-white/5 flex gap-2">
                  <a
                    href={creative.file}
                    download={creative.download}
                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-surface/70 hover:bg-white/10 hover:text-surface text-xs font-bold py-2.5 rounded-xl transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download {creative.type}
                  </a>
                  <button
                    onClick={() => setLightbox(true)}
                    className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-surface/50 hover:bg-white/10 hover:text-surface text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    Expand
                  </button>
                </div>
              </div>

              {/* Tracking URL info */}
              <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F5B942" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Click Tracking</p>
                    <p className="text-xs text-surface/30 mt-0.5">Every ad click is tracked with UTM parameters</p>
                  </div>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="bg-[#0a1018] rounded-xl px-4 py-3">
                    <p className="text-xs text-surface/30 mb-1.5 font-semibold uppercase tracking-wider">Destination URL</p>
                    <p className="text-xs font-mono text-primary break-all">{trackingUrl.replace('YOUR-SITE.COM', 'your-site.com')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { param: 'utm_source', value: 'your-site.com', note: 'Publisher domain' },
                      { param: 'utm_medium', value: 'display', note: 'Ad type' },
                      { param: 'utm_campaign', value: 'blockcoin-ads', note: 'Campaign name' },
                      { param: 'utm_content', value: `creative-${creative.id}`, note: 'Which creative' },
                    ].map(p => (
                      <div key={p.param} className="bg-[#0a1018] rounded-lg px-3 py-2.5">
                        <p className="text-xs font-mono text-secondary/70">{p.param}</p>
                        <p className="text-xs font-bold text-surface/70 mt-0.5 truncate">{p.value}</p>
                        <p className="text-xs text-surface/25 mt-0.5">{p.note}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-surface/30 leading-relaxed">
                    Replace <span className="font-mono text-surface/50 bg-white/5 px-1.5 py-0.5 rounded">YOUR-SITE.COM</span> in the snippet with your actual domain so you can identify traffic sources in your analytics.
                  </p>
                </div>
              </div>

              {/* Snippet card */}
              <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Embed Snippet</p>
                    <p className="text-xs text-surface/30 mt-0.5">{size.label} — {size.width}×{size.height}px</p>
                  </div>
                  <CopyButton text={snippet} />
                </div>

                {/* Code block */}
                <div className="relative">
                  <pre className="text-xs text-surface/40 bg-[#0a1018] p-5 overflow-x-auto leading-relaxed whitespace-pre font-mono scrollbar-none">
                    <span className="text-secondary/70">{'<a'}</span>
                    {` href="${trackingUrl.replace('YOUR-SITE.COM', 'your-site.com')}"\n   target="_blank"\n   rel="noopener sponsored"\n   style="display:inline-block;\n          width:${size.width}px;\n          height:${size.height}px;\n          overflow:hidden;">\n  `}
                    <span className="text-secondary/70">{'<img'}</span>
                    {`\n    src="${SITE_URL}${creative.file}"\n    alt="BlockCoin"\n    width="${size.width}"\n    height="${size.height}"\n    style="width:${size.width}px;\n           height:${size.height}px;\n           object-fit:cover;\n           border:0;" />\n`}
                    <span className="text-secondary/70">{'</a>'}</span>
                  </pre>
                </div>

                <div className="px-5 py-4 border-t border-white/5">
                  <CopyButton text={snippet} full />
                </div>
              </div>

              {/* Tip */}
              <div className="flex gap-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3.5">
                <span className="text-primary text-base shrink-0 mt-0.5">💡</span>
                <p className="text-xs text-surface/50 leading-relaxed">
                  All clicks route through <span className="font-mono text-primary/80">/go</span> and land on <span className="font-mono text-primary/80">/register</span> with UTM params — track conversions in Google Analytics or any analytics tool.
                </p>
              </div>
            </div>
          </div>

          {/* ── How it works ── */}
          <div className="mt-20 pt-16 border-t border-white/5">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black tracking-tight mb-2">How It Works</h2>
              <p className="text-surface/40 text-sm">Three steps to display our ad on your website.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {[
                { step: '01', title: 'Pick a Creative', desc: 'Choose from 5 ad creatives — static PNG or animated GIF.' },
                { step: '02', title: 'Select a Size', desc: 'Pick the IAB standard size that fits your layout best.' },
                { step: '03', title: 'Copy & Paste', desc: 'Copy the HTML snippet and paste it into your website.' },
              ].map(s => (
                <div key={s.step} className="bg-card border border-white/5 rounded-2xl p-6 text-center hover:border-white/10 transition-colors">
                  <p className="text-4xl font-black text-primary/20 mb-4 tabular-nums">{s.step}</p>
                  <p className="font-bold text-sm mb-2">{s.title}</p>
                  <p className="text-xs text-surface/40 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="font-black text-sm hover:text-primary transition-colors tracking-tight">
            BlockCoin
          </Link>
          <p className="text-xs text-surface/20" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} BlockCoin. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-surface/30">
            <Link href="/" className="hover:text-surface transition-colors">Home</Link>
            <Link href="/login" className="hover:text-surface transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-surface transition-colors">Register</Link>
          </div>
        </div>
      </footer>

      {/* ── Lightbox ── */}
      {lightbox && (
        <Lightbox
          file={creative.file}
          label={creative.label}
          onClose={() => setLightbox(false)}
        />
      )}
    </div>
  )
}
