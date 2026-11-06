'use client'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const FEATURES = [
  { icon: '⚡', label: 'Instant access', desc: 'Open directly from your home screen' },
  { icon: '🔔', label: 'Live updates', desc: 'Real-time balance & transaction alerts' },
  { icon: '🔒', label: 'Secure & fast', desc: 'Works offline, no browser needed' },
]

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Don't show if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Don't show if user already dismissed this session
    if (sessionStorage.getItem('pwa-dismissed')) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as any).standalone
    setIsIOS(ios)

    // Always show after 2s — regardless of browser/device
    const t = setTimeout(() => setShow(true), 2000)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      clearTimeout(t)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setInstalling(false)
    if (outcome === 'accepted') {
      setInstalled(true)
      setTimeout(() => { setShow(false) }, 1500)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    sessionStorage.setItem('pwa-dismissed', '1')
  }

  if (!show) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[201] max-w-sm mx-auto animate-modal-in">
        <div className="bg-[#17232E] rounded-3xl overflow-hidden shadow-2xl shadow-black/60 border border-white/8">

          {/* Header gradient */}
          <div className="bg-gradient-to-br from-[#0d3d2c] via-[#0f4c35] to-[#0a2d20] px-6 pt-8 pb-6 text-center relative">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition active:scale-90"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* App icon */}
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <span className="text-4xl font-bold text-primary">₮</span>
            </div>

            <h2 className="text-xl font-bold text-white">Install BlockCoin App</h2>
            <p className="text-white/50 text-sm mt-1">Add to your home screen for the best experience</p>
          </div>

          {/* Features list */}
          <div className="px-6 py-5 space-y-4">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xl shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface">{f.label}</p>
                  <p className="text-xs text-surface/40 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* iOS instructions */}
          {isIOS && (
            <div className="mx-6 mb-4 bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
              <p className="text-xs font-semibold text-surface/60 mb-2">How to install on iPhone / iPad:</p>
              <div className="flex items-center gap-2 text-sm text-surface/70">
                <span>1. Tap</span>
                <div className="w-7 h-7 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-secondary">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <span>Share</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-surface/70 mt-1.5">
                <span>2. Tap</span>
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" className="text-surface/60">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="font-medium text-surface">"Add to Home Screen"</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-6 pb-6 space-y-2.5">
            {installed ? (
              <div className="w-full bg-primary/20 text-primary font-semibold py-3.5 rounded-2xl text-sm text-center flex items-center justify-center gap-2">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                App Installed!
              </div>
            ) : !isIOS && deferredPrompt ? (
              <button
                onClick={handleInstall}
                disabled={installing}
                className="w-full bg-primary text-bg font-bold py-3.5 rounded-2xl text-sm active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {installing ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Installing…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Install App
                  </>
                )}
              </button>
            ) : !isIOS ? (
              <div className="w-full bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5 text-center space-y-1">
                <p className="text-sm font-semibold text-surface/60">Open in Chrome or Edge</p>
                <p className="text-xs text-surface/30">For one-tap install, visit this site in Chrome or Edge on Android or desktop</p>
              </div>
            ) : null}

            <button
              onClick={handleDismiss}
              className="w-full text-surface/40 text-sm py-2 hover:text-surface/60 transition active:scale-95"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
