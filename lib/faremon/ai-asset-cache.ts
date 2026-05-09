import { createHash } from 'node:crypto'

const memory = new Map<string, string>()

export function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt, 'utf8').digest('hex').slice(0, 32)
}

export function getCachedGeneratedAsset(promptHash: string): string | undefined {
  return memory.get(promptHash)
}

export function saveGeneratedAsset(promptHash: string, assetDataUrl: string): void {
  memory.set(promptHash, assetDataUrl)
  if (memory.size > 500) {
    const first = memory.keys().next().value
    if (first) memory.delete(first)
  }
}
