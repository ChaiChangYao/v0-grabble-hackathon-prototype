import { NextResponse } from 'next/server'
import { createMatchSession } from '@/lib/match-session-store'

export async function POST() {
  const session = createMatchSession()
  return NextResponse.json({ matchId: session.matchId })
}
