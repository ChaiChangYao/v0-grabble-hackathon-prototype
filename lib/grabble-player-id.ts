const KEY = 'grabblePlayerId'
const LEGACY_MATCH = 'grabble-match-client-id'

/**
 * Stable per-browser id for multiplayer room membership (survives refresh).
 */
export function getOrCreateLocalPlayerId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = localStorage.getItem(LEGACY_MATCH)
      if (id) {
        localStorage.setItem(KEY, id)
      }
    }
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `gp-${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return `gp-fallback-${Date.now()}`
  }
}

export function persistRoomRole(roomCode: string, role: 'player1' | 'player2') {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem('grabbleRoomRoles')
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    map[roomCode.toUpperCase()] = role
    localStorage.setItem('grabbleRoomRoles', JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

export function readPersistedRoomRole(roomCode: string): 'player1' | 'player2' | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('grabbleRoomRoles')
    if (!raw) return null
    const map = JSON.parse(raw) as Record<string, string>
    const r = map[roomCode.toUpperCase()]
    if (r === 'player1' || r === 'player2') return r
    return null
  } catch {
    return null
  }
}
