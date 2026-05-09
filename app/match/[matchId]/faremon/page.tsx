'use client'

import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { GrabbleDemo } from '@/components/grabble/grabble-demo'

function MatchFaremonInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const matchId = String(params.matchId ?? '')
  const role = searchParams.get('role') === 'player2' ? 2 : 1
  return <GrabbleDemo matchSessionId={matchId} matchRole={role} matchGame="faremon" />
}

export default function MatchFaremonPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#0f172a] text-white/80">
          Loading…
        </div>
      }
    >
      <MatchFaremonInner />
    </Suspense>
  )
}
