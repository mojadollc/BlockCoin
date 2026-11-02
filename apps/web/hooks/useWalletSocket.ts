'use client'
import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL ?? '', {
      withCredentials: true,
      transports: ['websocket'],
    })
  }
  return socket
}

export function useWalletSocket(walletId: string | null, onUpdate: () => void) {
  const cbRef = useRef(onUpdate)
  cbRef.current = onUpdate

  useEffect(() => {
    if (!walletId) return
    const s = getSocket()
    s.emit('join:wallet', walletId)
    const handler = () => cbRef.current()
    s.on('balance:update', handler)
    return () => { s.off('balance:update', handler) }
  }, [walletId])
}
