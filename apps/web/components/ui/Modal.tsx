'use client'
import { useEffect, useRef } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div ref={ref} className="bg-card rounded-xl w-full max-w-lg border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h3 className="font-semibold text-surface">{title}</h3>
          <button onClick={onClose} className="text-surface/40 hover:text-surface transition text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
