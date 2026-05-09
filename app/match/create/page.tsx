'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy URL — real flow is `/room/create` */
export default function MatchCreateRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/room/create')
  }, [router])
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0f172a] text-white/85">
      Redirecting…
    </div>
  )
}
