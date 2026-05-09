const POS: Record<number, number> = {
  0: 1,
  1: 1.5,
  2: 2,
  3: 2.5,
  4: 3,
  5: 3.5,
  6: 4,
}

const NEG: Record<number, number> = {
  [-1]: 0.67,
  [-2]: 0.5,
  [-3]: 0.4,
  [-4]: 0.33,
  [-5]: 0.29,
  [-6]: 0.25,
}

export function clampStatStage(n: number): number {
  return Math.max(-6, Math.min(6, Math.trunc(n)))
}

export function getStageMultiplier(stage: number): number {
  const s = clampStatStage(stage)
  if (s === 0) return 1
  if (s > 0) return POS[s] ?? 1
  return NEG[s] ?? 1
}

/** Modify stage by delta, clamp to [-6,6] */
export function applyStageDelta(stage: number, delta: number): number {
  return clampStatStage(stage + delta)
}
