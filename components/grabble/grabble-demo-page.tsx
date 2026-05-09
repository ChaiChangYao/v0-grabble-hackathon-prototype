'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Toaster } from 'sonner'
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
      <Toaster richColors position="top-center" theme="dark" />
      <GrabbleDemoWithQuery />
    </Suspense>
  )
}
