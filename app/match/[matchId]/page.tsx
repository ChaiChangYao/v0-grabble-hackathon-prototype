import { redirect } from 'next/navigation'

export default async function LegacyMatchRoomPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  redirect(`/room/${matchId}`)
}
