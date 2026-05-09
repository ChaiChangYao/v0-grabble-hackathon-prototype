import { Suspense } from 'react'
import { MatchLobby } from '@/components/match/match-lobby'

export default async function MatchRoomPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white/80">
          Loading…
        </div>
      }
    >
      <MatchLobby matchId={matchId} />
    </Suspense>
  )
}
