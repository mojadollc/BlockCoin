'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://blockcoin.beegoo.app'

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }}
      className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 rounded-xl transition-all border ${
        copied
          ? 'bg-primary/15 text-primary border-primary/30'
          : 'bg-white/5 border-white/10 text-surface/60 hover:bg-white/10 hover:text-surface'
      }`}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {label}
        </>
      )}
    </button>
  )
}

export default function VideoPlayer({
  url,
  title,
  trackingUrl,
  slug,
}: {
  url: string
  title: string
  trackingUrl: string
  slug: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Share toast
  const [shareToast, setShareToast] = useState(false)

  // Heart / likes
  const [likes, setLikes] = useState(0)
  const [liked, setLiked] = useState(false)
  const [heartBurst, setHeartBurst] = useState(false)

  // Fetch initial like count
  useEffect(() => {
    fetch(`${API_URL}/api/v1/ads/${slug}/likes`)
      .then(r => r.json())
      .then(d => { if (typeof d.count === 'number') setLikes(d.count) })
      .catch(() => {})
  }, [slug])

  // Auto-hide controls
  useEffect(() => {
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 2500)
    } else {
      setShowControls(true)
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [playing])

  const revealControls = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    if (playing) {
      hideTimer.current = setTimeout(() => setShowControls(false), 2500)
    }
  }, [playing])

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
    revealControls()
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  const onTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgress((v.currentTime / v.duration) * 100)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const shareUrl = window.location.href
    if (navigator.share) {
      navigator.share({ title, url: shareUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2500)
    }
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (liked) return
    setHeartBurst(true)
    setTimeout(() => setHeartBurst(false), 600)
    try {
      const res = await fetch(`${API_URL}/api/v1/ads/${slug}/like`, { method: 'POST' })
      const data = await res.json()
      setLikes(data.count)
      setLiked(true)
    } catch {
      setLikes(l => l + 1)
      setLiked(true)
    }
  }

  if (!url) {
    return (
      <div className="w-full bg-card border border-white/5 rounded-3xl flex flex-col items-center justify-center gap-3 py-20">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface/20">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-surface/40">Video not configured</p>
          <p className="text-xs text-surface/20 mt-1">Run the R2 upload script and add the URL to .env</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div
        className="relative bg-black rounded-3xl overflow-hidden shadow-2xl shadow-black/60 cursor-pointer select-none"
        style={{ width: '100%', maxWidth: '400px', aspectRatio: '9/16' }}
        onClick={toggle}
        onMouseMove={revealControls}
        onTouchStart={revealControls}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={url}
          className="absolute inset-0 w-full h-full object-cover"
          muted={muted}
          playsInline
          loop
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={onTimeUpdate}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* ── Share toast ── */}
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${shareToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          <div className="bg-white text-bg text-xs font-black px-4 py-2 rounded-full shadow-xl flex items-center gap-2 whitespace-nowrap">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Link copied!
          </div>
        </div>

        {/* ── Top bar ── */}
        <div className={`absolute top-0 left-0 right-0 p-4 flex items-center justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-white">BlockCoin</span>
          </div>
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener sponsored"
            onClick={e => e.stopPropagation()}
            className="bg-primary text-bg text-xs font-black px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors shadow-lg"
          >
            Get Started →
          </a>
        </div>

        {/* ── Center play/pause ── */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${!playing || showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`w-20 h-20 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-transform duration-150 ${playing ? 'scale-75 opacity-60' : 'scale-100 opacity-100'}`}>
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#00C89B" style={{ marginLeft: '4px' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </div>
        </div>

        {/* ── Right side actions ── */}
        <div className={`absolute right-3 bottom-28 flex flex-col items-center gap-5 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>

          {/* Heart */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1">
            <div className={`w-11 h-11 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-200 ${
              liked
                ? 'bg-red-500/30 border-red-400/50'
                : 'bg-black/50 border-white/10 hover:bg-red-500/20 hover:border-red-400/30'
            } ${heartBurst ? 'scale-125' : 'scale-100'}`}>
              <svg
                width="18" height="18" viewBox="0 0 24 24"
                fill={liked ? '#ef4444' : 'none'}
                stroke={liked ? '#ef4444' : 'white'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform duration-200 ${heartBurst ? 'scale-125' : 'scale-100'}`}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span className={`text-xs font-bold transition-colors ${liked ? 'text-red-400' : 'text-white/60'}`}>
              {likes > 0 ? likes.toLocaleString() : 'Like'}
            </span>
          </button>

          {/* Share */}
          <button onClick={handleShare} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
            <span className="text-white/60 text-xs">Share</span>
          </button>

          {/* Mute */}
          <button onClick={toggleMute} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </div>
            <span className="text-white/60 text-xs">{muted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>

        {/* ── Bottom info + progress ── */}
        <div className={`absolute bottom-0 left-0 right-0 px-4 pb-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white font-black text-base mb-1 drop-shadow">{title}</p>
          <p className="text-white/50 text-xs mb-4">blockcoin.beegoo.app</p>
          <div className="w-full h-1 bg-white/20 rounded-full cursor-pointer overflow-hidden" onClick={seek}>
            <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function CopyUrlButton({ url }: { url: string }) {
  return <CopyBtn text={url} label="Copy URL" />
}

export function CopySnippetButton({ text }: { text: string }) {
  return <CopyBtn text={text} label="Copy Embed Code" />
}
