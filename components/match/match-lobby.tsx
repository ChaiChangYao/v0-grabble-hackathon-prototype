'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, MessageCircle, QrCode, Swords } from 'lucide-react'
import { toast } from 'sonner'
import { copyTextToClipboard } from '@/lib/copy-to-clipboard'
import { getMatchClientId } from '@/lib/match-client-id'
import { defaultPlayer1 } from '@/lib/grabble-types'

export type MatchLobbySession = {
  matchId: string
  player1Connected: boolean
  player2Connected: boolean
  player1State: Record<string, unknown>
  player2State: Record<string, unknown>
  selectedGame: 'faremon' | 'battleship' | null
  gameStatus: string
  version: number
  disconnectedPlayer: 1 | 2 | null
}

type LobbyError = 'FULL' | 'NOT_FOUND' | null

interface MatchLobbyProps {
  matchId: string
}

/** P1 host — Ride Challenger; P2 — Fare Opponent */
export function MatchLobby({ matchId }: MatchLobbyProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')
  const role: 1 | 2 = roleParam === 'player2' ? 2 : 1
  const clientId = useMemo(() => getMatchClientId(), [])

  const [session, setSession] = useState<MatchLobbySession | null>(null)
  const [error, setError] = useState<LobbyError>(null)
  const [connecting, setConnecting] = useState(true)
  const navigatedToGame = useRef(false)

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const base = window.location.origin
    return `${base}/match/${matchId}?role=player2`
  }, [matchId])

  const connect = useCallback(async () => {
    try {
      const profile =
        role === 1
          ? {
              displayName: defaultPlayer1.name,
              pickup: defaultPlayer1.pickup,
              destination: defaultPlayer1.destination,
              roleLabel: 'Ride Challenger',
            }
          : {
              displayName: 'Fare Opponent',
              roleLabel: 'Fare Opponent',
            }
      const r = await fetch(`/api/match/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          role,
          clientId,
          profile,
        }),
      })
      if (r.status === 409) {
        setError('FULL')
        return
      }
      if (!r.ok) {
        setError('NOT_FOUND')
        return
      }
      const j = (await r.json()) as MatchLobbySession
      setSession(j)
    } catch {
      setError('NOT_FOUND')
    } finally {
      setConnecting(false)
    }
  }, [matchId, role, clientId])

  const didConnect = useRef(false)
  useEffect(() => {
    if (didConnect.current) return
    didConnect.current = true
    void connect()
  }, [connect])

  useEffect(() => {
    if (!session || error) return
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/match/${matchId}`)
        if (!r.ok) return
        const j = (await r.json()) as MatchLobbySession
        setSession(j)
      } catch {
        /* ignore */
      }
    }, 900)
    return () => clearInterval(id)
  }, [matchId, session, error])

  useEffect(() => {
    if (!session || navigatedToGame.current || error) return
    if (
      session.gameStatus !== 'game_selected' ||
      !session.selectedGame ||
      session.disconnectedPlayer
    ) {
      return
    }
    navigatedToGame.current = true
    const gamePath =
      session.selectedGame === 'faremon' ? 'faremon' : 'battleship'
    const roleQ = role === 1 ? 'player1' : 'player2'
    const t = setTimeout(() => {
      router.replace(`/match/${matchId}/${gamePath}?role=${roleQ}`)
    }, 1000)
    return () => clearTimeout(t)
  }, [session, error, matchId, router, role])

  useEffect(() => {
    const onUnload = () => {
      void fetch(`/api/match/${matchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', role, clientId }),
        keepalive: true,
      })
    }
    window.addEventListener('pagehide', onUnload)
    return () => window.removeEventListener('pagehide', onUnload)
  }, [matchId, role, clientId])

  const onCopyLink = async () => {
    const ok = await copyTextToClipboard(shareUrl)
    if (ok) toast.success('Battle link copied')
    else toast.error('Could not copy')
  }

  const onShareWhatsapp = () => {
    const text = `Join my Grabble battle (Player 2):\n${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  if (connecting && !error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4">
        <p className="text-center text-lg text-white/80">Connecting…</p>
      </div>
    )
  }

  if (error === 'FULL') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-6 text-center">
        <Swords className="h-12 w-12 text-amber-400" />
        <h1 className="text-xl font-semibold text-white">This battle is already full.</h1>
        <p className="max-w-sm text-white/70">
          Ask the host to share a new battle link.
        </p>
      </div>
    )
  }

  if (error === 'NOT_FOUND') {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-6 text-center">
        <p className="text-xl text-white">Match not found.</p>
      </div>
    )
  }

  const p1Name =
    typeof session?.player1State?.displayName === 'string'
      ? session.player1State.displayName
      : defaultPlayer1.name
  const p1Pickup =
    typeof session?.player1State?.pickup === 'string'
      ? session.player1State.pickup
      : defaultPlayer1.pickup
  const p1Dest =
    typeof session?.player1State?.destination === 'string'
      ? session.player1State.destination
      : defaultPlayer1.destination

  const opponentDisconnected =
    session != null &&
    session.disconnectedPlayer != null &&
    session.disconnectedPlayer === (role === 1 ? 2 : 1)

  const statusLine =
    opponentDisconnected
      ? 'Opponent disconnected. Waiting for reconnection…'
      : role === 1
        ? session?.player2Connected
          ? 'Opponent joined. Starting battle…'
          : 'Share this link with Player 2'
        : 'You joined as Player 2. Syncing…'

  const gameLabel =
    session?.selectedGame === 'faremon'
      ? 'Faremon'
      : session?.selectedGame === 'battleship'
        ? 'Battleship'
        : null

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4 py-10">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <header className="text-center">
          <div className="mb-2 flex justify-center">
            <div className="rounded-full bg-[#00b14f]/15 p-3 ring-2 ring-[#00b14f]/40">
              <Swords className="h-8 w-8 text-[#7dffb2]" />
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00b14f]">
            {role === 1 ? 'Player 1 · Ride Challenger' : 'Player 2 · Fare Opponent'}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            {role === 1 ? 'Waiting for opponent' : 'Battle lobby'}
          </h1>
        </header>

        {role === 1 && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <p className="mb-3 text-center text-sm text-white/75">{statusLine}</p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={onCopyLink}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#00b14f] py-3 text-sm font-semibold text-white shadow-lg shadow-[#00b14f]/25"
              >
                <Copy className="h-4 w-4" />
                Copy Battle Link
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={onShareWhatsapp}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4" />
                Share via WhatsApp
              </motion.button>
            </div>

            <p className="mt-4 break-all rounded-lg bg-black/30 p-3 font-mono text-[11px] text-white/60">
              {shareUrl}
            </p>

            <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/20 py-8 text-white/40">
              <QrCode className="h-12 w-12" />
              <span className="text-xs">QR code placeholder</span>
            </div>
          </section>
        )}

        {role === 2 && (
          <section className="space-y-4">
            <motion.div
              layout
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md"
            >
              <p className="mb-3 text-center text-sm font-medium text-[#7dffb2]">
                You joined as Player 2
              </p>
              <div className="rounded-xl bg-gradient-to-br from-[#00b14f]/20 to-transparent p-4 ring-1 ring-[#00b14f]/30">
                <p className="text-xs uppercase tracking-wide text-white/50">
                  Player 1 · Ride Challenger
                </p>
                <p className="text-lg font-semibold text-white">{p1Name}</p>
                <p className="mt-2 text-sm text-white/70">
                  {p1Pickup} → {p1Dest}
                </p>
              </div>
              <p className="mt-4 text-center text-sm text-white/70">{statusLine}</p>
            </motion.div>
          </section>
        )}

        <AnimatePresence>
          {session?.gameStatus === 'game_selected' && gameLabel && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-[#00b14f]/40 bg-[#00b14f]/10 px-4 py-4 text-center"
            >
              <p className="text-sm text-white/80">Game selected</p>
              <p className="text-xl font-bold text-[#7dffb2]">{gameLabel}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
