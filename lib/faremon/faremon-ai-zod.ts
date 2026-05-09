import { z } from 'zod'
export const fareMonMoveAiSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.string(),
  category: z.string(),
  power: z.number().optional(),
  accuracy: z.number().optional(),
  priority: z.number().optional(),
  target: z.string().optional(),
  statChanges: z.record(z.string(), z.number()).optional(),
  statusEffect: z.string().nullable().optional(),
  duration: z.number().optional(),
  description: z.string().optional(),
  dpsRole: z.string().optional(),
  iconPrompt: z.string().optional(),
})

export const fareMonAiSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  primaryType: z.string(),
  secondaryType: z.string().nullable().optional(),
  maxHP: z.number().optional(),
  currentHP: z.number().optional(),
  attack: z.number().optional(),
  defense: z.number().optional(),
  speed: z.number().optional(),
  accuracy: z.number().optional(),
  evasion: z.number().optional(),
  farePressure: z.number().optional(),
  playstyle: z.string().optional(),
  dpsProfile: z
    .object({
      burst: z.number(),
      sustain: z.number(),
      control: z.number(),
      defense: z.number(),
      speed: z.number(),
    })
    .partial()
    .optional(),
  visualIdentity: z.string().optional(),
  characterPromptFront: z.string().optional(),
  characterPromptBack: z.string().optional(),
  moves: z.array(fareMonMoveAiSchema).optional(),
})

export const generateFareMonTeamResponseSchema = z.object({
  faremons: z.array(fareMonAiSchema).min(2).max(2),
})
