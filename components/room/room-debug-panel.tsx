'use client'

import { useState } from 'react'
import type { GrabbleRoom } from '@/lib/grabble-room-types'

const dev = process.env.NODE_ENV === 'development'

export function RoomDebugPanel(props: {
  roomCode: string
  localPlayerId: string
  resolvedRole: 1 | 2
  room: GrabbleRoom | null
}) {
  const [open, setOpen] = useState(false)
  if (!dev || !props.room) return null

  const r = props.room
  const fs = r.faremonState
  const regenerateImages = async () => {
    await fetch(`/api/room/${props.roomCode}/faremon/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: props.localPlayerId, force: true }),
    })
  }

  return (
    <div className="fixed bottom-2 left-2 z-[100] max-w-[min(96vw,380px)] text-xs">
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="rounded-lg bg-black/70 px-2 py-1 font-mono text-white/80"
      >
        debug {open ? '▼' : '▶'}
      </button>
      {open && (
        <div className="mt-1 rounded-lg bg-black/80 p-2">
          <button
            type="button"
            onClick={regenerateImages}
            className="mb-2 rounded bg-[#00b14f]/25 px-2 py-1 font-mono text-[10px] text-[#7dffb2]"
          >
            Regenerate Battle Images
          </button>
          <pre className="max-h-[50vh] overflow-auto text-[10px] text-[#7dffb2]">
            {JSON.stringify(
              {
                roomCode: props.roomCode,
                localPlayerId: props.localPlayerId,
                resolvedRole: props.resolvedRole,
                status: r.status,
                version: r.version,
                selectedGame: r.selectedGame,
                faremonPhase: fs?.phase,
                generationStarted: r.faremonGenerationStarted,
                generating: r.faremonGenerating,
                imageGenerationStarted: fs?.imageGenerationStarted,
                imageGenerationCompleted: fs?.imageGenerationCompleted,
                imageGenerationError: fs?.imageGenerationError,
                p1LockedTeam: fs?.player1Team.locked,
                p2LockedTeam: fs?.player2Team.locked,
                p1Types: fs?.player1Team.selectedTypes?.length,
                p2Types: fs?.player2Team.selectedTypes?.length,
                p1TeamLen: fs?.player1Team.faremon1 ? 1 : 0,
                p2TeamLen: fs?.player2Team.faremon1 ? 1 : 0,
                p1PendingAction: Boolean(fs?.player1Action),
                p2PendingAction: Boolean(fs?.player2Action),
                resolving: r.faremonResolvingTurn,
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}
    </div>
  )
}
