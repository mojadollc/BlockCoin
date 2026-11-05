'use client'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('pwa-dismissed')) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as any).standalone
    if (ios) { setIsIOS(true); setShow(true); return }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa-dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[100] md:hidden animate-slide-up">
      <div className="bg-sidebar border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/60">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 text-2xl">
            ₮
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-surface text-sm">Add BlockCoin to Home Screen</p>
            <p className="text-xs text-surface/50 mt-0.5">
              {isIOS
                ? 'Tap the share button then "Add to Home Screen"'
                : 'Install for a faster, app-like experience'}
            </p>
          </div>
          <button onClick={handleDismiss} className="text-surface/30 hover:text-surface/60 p-1 shrink-0 -mt-1 -mr-1">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isIOS && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 bg-primary text-bg text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 active:scale-95 transition-all"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 text-sm text-surface/50 hover:text-surface/80 transition"
            >
              Not now
            </button>
          </div>
        )}

        {isIOS && (
          <div className="mt-3 flex items-center gap-2 text-xs text-surface/40 bg-white/5 rounded-xl px-3 py-2">
            <span>Tap</span>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24" className="text-secondary">
              <path d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z" />
            </svg>
            <span>then "Add to Home Screen"</span>
          </div>
        )}
      </div>
    </div>
  )
}
