"use client"

import { useMemo } from "react"
import { getCommentaryLine, type CommentaryData } from "@/grabble/src/data"

export type CommentaryPhase = keyof CommentaryData

export type AICommentaryBubbleProps = {
  phase: CommentaryPhase
  /** Use with `phase="battle"` — move id from `game-faremons.json` (e.g. `surge-bite`). */
  moveId?: string
}

export function AICommentaryBubble({ phase, moveId }: AICommentaryBubbleProps) {
  const line = useMemo(
    () => getCommentaryLine(phase, moveId),
    [phase, moveId]
  )

  return (
    <div className="rounded-2xl bg-white/90 px-4 py-2 text-sm text-gray-700 shadow">
      <span aria-hidden>🤖 </span>
      <span className="font-medium text-green-700">AI</span>
      <span className="text-gray-400"> · </span>
      <span>{line}</span>
    </div>
  )
}
