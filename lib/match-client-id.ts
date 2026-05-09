const STORAGE_KEY = 'grabble-match-client-id'

export function getMatchClientId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = sessionStorage.getItem(STORAGE_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `mc-${Date.now()}-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return `mc-fallback-${Date.now()}`
  }
}
