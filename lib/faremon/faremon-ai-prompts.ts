import type { FareMonType } from './types'

export interface RouteContextInput {
  pickup: string
  destination: string
  normalFare: number
  timeOfDay: string
  weather: string
  city: string
}

export function buildFareMonTeamGenerationPrompt(args: {
  selectedTypes: FareMonType[]
  routeContext: RouteContextInput
  playerId: string
  matchSeed: string
  generationNonce: string
}): string {
  const { selectedTypes, routeContext, playerId, matchSeed, generationNonce } = args
  const typesList = selectedTypes.join(', ')
  return `You are generating original battle creature data for a ride-hailing strategy game called FareMon Duel.

Return strict JSON only. No markdown. No explanation.

Generate exactly one FareMon for each selected primary type:
${typesList}

Context:
City: ${routeContext.city}
Pickup: ${routeContext.pickup}
Destination: ${routeContext.destination}
Fare: ${routeContext.normalFare}
Time: ${routeContext.timeOfDay}
Weather: ${routeContext.weather}
Player: ${playerId}
Match seed: ${matchSeed}
Generation nonce: ${generationNonce}

Important uniqueness requirement:
Do not generate generic repeated creatures.
Do not always give the same type the same name, stats, or moves.
Make every match feel different.
For each FareMon, create a distinct name, stat profile, secondary type, move set, DPS profile, and visual prompt.

Allowed types:
Normal, Fire, Water, Grass, Electric, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy.

Each FareMon:
- must have the selected type as primaryType
- may have one secondaryType from the allowed types
- secondaryType must be different from primaryType
- should have a clear playstyle
- should have randomized but balanced stats
- should have exactly 4 moves
- should include both front and back character prompts

Stat ranges:
maxHP: 85 to 120
attack: 45 to 75
defense: 35 to 65
speed: 30 to 90
accuracy: 100
evasion: 100
farePressure: 50

DPS profile:
Give each FareMon a dpsProfile with 1 to 10 ratings:
- burst
- sustain
- control
- defense
- speed

Move generation rules:
- exactly 4 moves per FareMon
- at least 1 move must match primaryType
- at least 1 move must be a damaging move
- at least 1 move must be non-damaging
- no more than 3 pure damage moves
- moves can be from other types, not just the FareMon's own type
- a Dragon type FareMon may have Fire, Flying, Grass, Dark, Steel, or other type moves if it fits the generated creature
- moves must have varied categories

Allowed move categories:
Damage, Stat Boost, Stat Debuff, Status, Shield, Recovery, Setup, Disruption.

Allowed status effects:
Sleep, Poison, Burn, Paralysis, None.

Move fields:
id, name, type, category, power, accuracy, priority, target, statChanges, statusEffect, duration, description, dpsRole, iconPrompt.

Move constraints:
power: 0 to 90
accuracy: 60 to 100
priority: -1, 0, or 1
target: self or opponent
statChanges must only include attack, defense, speed, accuracy, evasion
statChanges values must be between -2 and +2
duration must be 0 to 3
statusEffect must be Sleep, Poison, Burn, Paralysis, None, or null

For non-damaging moves:
power should be 0.

For damaging moves:
power should be 35 to 90.

Name requirements:
- Use original names only.
- Do not use copyrighted monster names.
- Do not use official move names from existing monster-battle franchises.
- Do not use real brand names.
- Do not use names from well-known creature-catching franchises.
- Names should feel like original ride-hailing elemental battle creatures.

Visual prompt requirements:
Create characterPromptFront and characterPromptBack for each FareMon.
Both prompts must describe the same creature, same colors, same body shape, same markings, and same type identity.
Only the camera angle changes:
- front prompt = creature facing camera/opponent
- back prompt = creature viewed from behind, player-side battle perspective

The front and back prompts must be consistent enough that generated images look like the same creature from two angles.

Return strict JSON matching the schema.`
}

export function buildFareMonCreatureImagePrompts(faremon: {
  name: string
  primaryType: string
  secondaryType?: string | null
  visualIdentity: string
}): { frontPrompt: string; backPrompt: string } {
  const id = faremon.visualIdentity.trim()
  const sec = faremon.secondaryType ? `/${faremon.secondaryType}` : ''
  const base = `Creature: ${faremon.name}. Type: ${faremon.primaryType}${sec}. Design identity: ${id}.`
  return {
    frontPrompt: `Create a 16-bit pixel art creature sprite for an original retro handheld monster-battle game. ${base} Camera angle: front-facing 3/4 view, opponent-side sprite, creature looking toward the player. Transparent background. Clean silhouette. Limited color palette. No text. No logos. No UI. No copyrighted characters.`,
    backPrompt: `Create a 16-bit pixel art creature sprite for an original retro handheld monster-battle game. ${base} Camera angle: back-facing 3/4 view, player-side sprite, creature looking toward the opponent. Transparent background. Same creature, same silhouette, same colors, same markings as the front view. No text. No logos. No UI. No copyrighted characters.`,
  }
}

export interface BattleBackgroundInput {
  environmentTheme: string
  platformShape: string
  foregroundPlatform: string
  platformSurfaceDetail: string
  platformEdgeDetail: string
  backgroundEnvironmentTheme: string
  platformColors: string
  backgroundColors: string
}

export function buildBattleBackgroundPrompt(br: BattleBackgroundInput): string {
  return `[${br.environmentTheme}] 16-bit Pixel Art Battle Stage

Scene Type:
A 16-bit pixel art battle stage, rendered in a clean and vibrant retro handheld monster-battle style.

Composition:
The perspective is a shallow-angle isometric view, with a central, raised ${br.platformShape} in the mid-ground. At the very bottom edge of the frame, there is a small edge of ${br.foregroundPlatform} to imply depth.

Mid-ground Platform Details:
The central raised platform is a circular ${br.platformShape}. Its surface is covered in ${br.platformSurfaceDetail}. It has a defined, raised lip or rim made of ${br.platformEdgeDetail}. A small, subtle indicator such as a light patch shows the spot where a creature would stand.

Background Details:
The field behind the platform is the primary environment, styled with receding horizontal bands of varying shades. These bands define the landscape of ${br.backgroundEnvironmentTheme}.

Color Palette:
The scene uses a limited, specific, and vibrant color palette. The core colors for the platform are ${br.platformColors}, and the colors for the background are ${br.backgroundColors}.

Restrictions:
No text. No logos. No UI. No HP bars. No buttons. No copyrighted characters. No real brand marks.`
}
