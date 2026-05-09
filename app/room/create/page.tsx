'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getOrCreateLocalPlayerId } from '@/lib/grabble-player-id'

export default function RoomCreatePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const playerId = getOrCreateLocalPlayerId()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/room/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId }),
        })
        if (!r.ok) {
          setError('Could not create room')
          return
        }
        const j = (await r.json()) as { roomCode: string }
        if (!cancelled) router.replace(`/room/${j.roomCode}`)
      } catch {
        setError('Network error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router, playerId])

  if (error) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[#0f172a] px-6 text-center text-white">
        <p>{error}</p>
        <button type="button" onClick={() => router.push('/')} className="rounded-full bg-white/10 px-5 py-2 text-sm">
          Home
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0f172a] text-white/85">
      Creating room…
    </div>
  )
}
