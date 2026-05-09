'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GrabbleDemo } from './grabble-demo'

function GrabbleDemoWithQuery() {
  const sp = useSearchParams()
  const room = sp.get('faremonRoom')
  const roleRaw = sp.get('role')
  const role = roleRaw === '2' ? 2 : 1
  return (
    <GrabbleDemo
      faremonRoomId={room ? room.toUpperCase() : undefined}
      faremonRemoteRole={room ? role : undefined}
    />
  )
}

export function GrabbleDemoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a]" />}>
      <GrabbleDemoWithQuery />
    </Suspense>
  )
}
