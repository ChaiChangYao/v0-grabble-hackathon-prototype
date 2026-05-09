import { NextResponse } from 'next/server'

/** Placeholder route — legacy path retained for older clients */
export async function POST() {
  return NextResponse.json({ ok: false, message: 'Not implemented' }, { status: 501 })
}
