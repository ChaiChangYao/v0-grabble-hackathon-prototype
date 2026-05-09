"use client"

import { ConvexProvider, ConvexReactClient } from "convex/react"
import { type ReactNode, useMemo } from "react"

/**
 * If `NEXT_PUBLIC_CONVEX_URL` is unset, children render without Convex
 * so the app builds before the first `npx convex dev`.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url?.trim()) return null
    return new ConvexReactClient(url)
  }, [])

  if (!client) {
    return <>{children}</>
  }

  return <ConvexProvider client={client}>{children}</ConvexProvider>
}
