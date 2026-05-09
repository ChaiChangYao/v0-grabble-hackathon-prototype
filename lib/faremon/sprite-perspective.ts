import type { FareMon } from './types'

/** Own creature = back sprite (faces opponent); opposing creature = front sprite */
export function getSpriteForPerspective(
  viewerPlayerId: 1 | 2,
  faremonOwnerPlayerId: 1 | 2,
  faremon: FareMon,
): string | null {
  if (viewerPlayerId === faremonOwnerPlayerId) {
    return faremon.backImageUrl ?? null
  }
  return faremon.frontImageUrl ?? null
}
