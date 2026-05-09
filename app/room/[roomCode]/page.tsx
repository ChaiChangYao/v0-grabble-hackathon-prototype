'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { copyTextToClipboard } from '@/lib/copy-to-clipboard'
import { defaultPlayer1, defaultPlayer2 } from '@/lib/grabble-types'
import { getOrCreateLocalPlayerId, persistRoomRole } from '@/lib/grabble-player-id'
import type { GrabbleRoom } from '@/lib/grabble-room-types'
import { GrabbleDemo } from '@/components/grabble/grabble-demo'
import { RoomDebugPanel } from '@/components/room/room-debug-panel'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = String(params.roomCode ?? '').toUpperCase()
  const playerId = useMemo(() => getOrCreateLocalPlayerId(), [])

  const [room, setRoom] = useState<GrabbleRoom | null>(null)
  const [role, setRole] = useState<1 | 2 | null>(null)
  const [error, setError] = useState<'NOT_FOUND' | 'FULL' | null>(null)
  const [connecting, setConnecting] = useState(true)
  const enterOnce = useRef(false)

  const enter = useCallback(async () => {
    try {
      const r = await fetch(`/api/room/${roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enter', playerId }),
      })
      if (r.status === 404) {
        setError('NOT_FOUND')
        return
      }
      if (r.status === 409) {
        setError('FULL')
        return
      }
      if (!r.ok) {
        setError('NOT_FOUND')
        return
      }
      const j = (await r.json()) as { room: GrabbleRoom; role: 1 | 2 }
      setRoom(j.room)
      setRole(j.role)
      persistRoomRole(roomCode, j.role === 1 ? 'player1' : 'player2')
    } catch {
      setError('NOT_FOUND')
    } finally {
      setConnecting(false)
    }
  }, [roomCode, playerId])

  useEffect(() => {
    if (!roomCode) return
    if (enterOnce.current) return
    enterOnce.current = true
    void enter()
  }, [roomCode, enter])

  useEffect(() => {
    if (!roomCode || error) return
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/room/${roomCode}`)
        if (!r.ok) return
        const next = (await r.json()) as GrabbleRoom
        setRoom(next)
      } catch {
        /* ignore */
      }
    }, 900)
    return () => clearInterval(id)
  }, [roomCode, error])

  useEffect(() => {
    const onHide = () => {
      if (!roomCode || role == null) return
      void fetch(`/api/room/${roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect',
          playerId,
        }),
        keepalive: true,
      })
    }
    window.addEventListener('pagehide', onHide)
    return () => window.removeEventListener('pagehide', onHide)
  }, [roomCode, playerId, role])

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/room/${roomCode}`
  }, [roomCode])

  const copyShare = async () => {
    const ok = await copyTextToClipboard(shareUrl)
    if (ok) toast.success('Room link copied')
    else toast.error('Could not copy')
  }

  const startChallenge = async () => {
    if (!room) return
    try {
      const r = await fetch(`/api/room/${roomCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-challenge',
          playerId,
          expectedVersion: room.version,
        }),
      })
      if (!r.ok) {
        toast.error('Could not start')
        return
      }
      const j = (await r.json()) as { room: GrabbleRoom }
      setRoom(j.room)
    } catch {
      toast.error('Network error')
    }
  }

  if (!roomCode) {
    return <div className="p-8 text-white">Invalid room</div>
  }

  if (connecting && !error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0f172a] text-white/80">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error === 'NOT_FOUND') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[#0f172a] px-6 text-center">
        <p className="text-lg text-white">Room not found or expired.</p>
        <p className="max-w-sm text-sm text-white/60">
          Ask the host for a fresh link. If you use Vercel, add Upstash Redis env vars so rooms persist across servers.
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="rounded-full bg-white/10 px-5 py-2 text-sm text-white"
        >
          Home
        </button>
      </div>
    )
  }

  if (error === 'FULL') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-2 bg-[#0f172a] px-6 text-center text-white">
        <p className="text-lg font-medium">This room already has two players.</p>
        <p className="text-sm text-white/65">Open the link from the device you joined with, or start a new room.</p>
      </div>
    )
  }

  if (!room || role === null) {
    return null
  }

  const inLobby =
    room.status === 'waiting-for-player2' ||
    room.status === 'ready' ||
    room.status === 'selecting-game' ||
    room.status === 'pregame'

  if (inLobby) {
    const p1 = role === 1
    const oppDisconnected =
      room.disconnectedPlayer != null && room.disconnectedPlayer === (role === 1 ? 2 : 1)
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4 py-10">
        <div className="mx-auto flex max-w-md flex-col gap-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00b14f]">
              {p1 ? 'Grabble Room Created' : 'You joined Grabble'}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">
              {p1 ? 'You are Player 1' : 'You are Player 2'}
            </h1>
            <p className="mt-1 font-mono text-lg text-[#7dffb2]">{roomCode}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/85">
            <p className="mb-2 text-white/55">Room code</p>
            <p className="font-mono text-lg">{roomCode}</p>
            {p1 ? (
              <>
                <p className="mt-4 text-white/55">Your fare</p>
                <p>S${defaultPlayer1.normalFare.toFixed(2)}</p>
                <p className="mt-2 text-white/55">Winning / losing fare</p>
                <p>
                  S${defaultPlayer1.winnerFare.toFixed(2)} / S${defaultPlayer1.loserFare.toFixed(2)}
                </p>
              </>
            ) : (
              <>
                <p className="mt-4 text-white/55">Your fare</p>
                <p>S${defaultPlayer2.normalFare.toFixed(2)}</p>
                <p className="mt-2 text-white/55">Winning / losing fare</p>
                <p>
                  S${defaultPlayer2.winnerFare.toFixed(2)} / S${defaultPlayer2.loserFare.toFixed(2)}
                </p>
              </>
            )}
          </div>

          {p1 && (
            <>
              <div className="rounded-2xl border border-[#00b14f]/30 bg-[#00b14f]/10 p-4">
                <p className="text-center text-sm text-white/80">
                  {room.player2Connected
                    ? 'Player 2 joined. Start the challenge when ready.'
                    : 'Waiting for Player 2 to join…'}
                </p>
                <p className="mt-2 break-all text-center font-mono text-xs text-white/50">{shareUrl}</p>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={copyShare}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00b14f] py-3 text-sm font-semibold text-white"
                >
                  <Copy className="h-4 w-4" />
                  Copy invite link
                </motion.button>
                <p className="mt-2 text-center text-[11px] text-white/40">
                  Share this URL only — no role=player1 in the link.
                </p>
              </div>
              {role === 1 && room.player2Connected && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={startChallenge}
                  className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-[#0f172a]"
                >
                  Start Challenge
                </motion.button>
              )}
            </>
          )}

          {!p1 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/80">
              <p>Player 1 connected</p>
              <p className="mt-3 text-white/60">Waiting for Player 1 to start the challenge…</p>
            </div>
          )}

          {oppDisconnected && (
            <p className="text-center text-sm text-amber-300/90">
              Opponent disconnected. Waiting for reconnection…
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <GrabbleDemo
        viewMode="real-multiplayer"
        grabbleRoomCode={roomCode}
        grabblePlayerId={playerId}
        resolvedRole={role}
        serverRoom={room}
        onServerRoomUpdate={setRoom}
      />
      <RoomDebugPanel
        roomCode={roomCode}
        localPlayerId={playerId}
        resolvedRole={role}
        room={room}
      />
    </>
  )
}
