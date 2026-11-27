'use client'

import { useState, useRef } from 'react'

const SITE_URL = 'https://blockcoin.beegoo.app'

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
}: {
  url: string
  title: string
  trackingUrl: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)

  const toggle = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
  }

  if (!url) {
    return (
      <div className="w-full aspect-video bg-card border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface/20">
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
    <div className="space-y-3">
      {/* Player */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group shadow-2xl shadow-black/50">
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-cover"
          muted={muted}
          playsInline
          loop
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />

        {/* Overlay controls */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/80 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
              {title}
            </span>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener sponsored"
              className="text-xs font-bold text-bg bg-primary px-3 py-1 rounded-full hover:bg-primary/90 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              Get Started →
            </a>
          </div>

          {/* Center play button */}
          <button
            onClick={toggle}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all hover:scale-110 border border-white/20">
              {playing ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginLeft: '3px' }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
              )}
            </div>
          </button>

          {/* Bottom bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleMute}
              className="text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-sm rounded-full p-2"
            >
              {muted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
            <span className="text-xs text-white/50 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
              {muted ? 'Tap to unmute' : 'Sound on'}
            </span>
          </div>
        </div>

        {/* Initial play overlay when not playing */}
        {!playing && (
          <button
            onClick={toggle}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/40 flex items-center justify-center hover:bg-primary/30 transition-all hover:scale-105">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#00C89B" style={{ marginLeft: '4px' }}>
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          </button>
        )}
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
