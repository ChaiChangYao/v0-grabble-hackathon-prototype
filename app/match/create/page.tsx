'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MatchCreatePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/match/create', { method: 'POST' })
        if (!r.ok) {
          setError('Could not create match')
          return
        }
        const j = (await r.json()) as { matchId: string }
        if (cancelled) return
        router.replace(`/match/${j.matchId}?role=player1`)
      } catch {
        setError('Network error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-6 text-center">
        <p className="text-lg text-white">{error}</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-full bg-white/10 px-6 py-2 text-sm text-white"
        >
          Back home
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4">
      <p className="text-lg text-white/85">Creating match…</p>
    </div>
  )
}
