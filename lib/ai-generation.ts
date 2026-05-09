// AI Generation utilities for Grabble prototype
// These functions generate metadata and prompts for external AI image generation

// FareMon Battle Background Generation
export const faremonImageGenerationPrompt = 
  "Generate a pixel-art mobile battle background inspired by classic monster-duel games, but fully original. Scene: rainy Singapore expressway during peak hour, glowing green route lines, taxi-like ride-hailing energy, digital fare meters in the sky, soft neon reflections, vertical mobile battle composition, opponent area at top-right, player area at bottom-left, no copyrighted characters, no logos, no text, no UI buttons, background only."

export const minimalGrabIconStyle = 
  "Minimalist Grab-like ride-hailing icon, simple geometric shapes, solid green, white, and dark grey, clean sharp edges, no gradients, no complex shadows, no hand-drawn texture, iconic abstract vehicle symbol, professional mobile app illustration."

// Mock AI Icon Generator
export interface AIIconMetadata {
  iconName: string
  prompt: string
  style: string
  fallbackType: 'css-vehicle-icon' | 'css-route-icon' | 'css-action-icon' | 'css-creature-icon'
}

export function mockAIIconGenerator(iconName: string, category: 'vehicle' | 'route' | 'action' | 'creature'): AIIconMetadata {
  const basePrompt = `${minimalGrabIconStyle.replace('iconic abstract vehicle symbol', `iconic abstract ${iconName.toLowerCase()} symbol`)}`
  
  const fallbackMap: Record<string, 'css-vehicle-icon' | 'css-route-icon' | 'css-action-icon' | 'css-creature-icon'> = {
    vehicle: 'css-vehicle-icon',
    route: 'css-route-icon',
    action: 'css-action-icon',
    creature: 'css-creature-icon',
  }
  
  return {
    iconName,
    prompt: basePrompt,
    style: 'Grab-like minimalist transport icon',
    fallbackType: fallbackMap[category],
  }
}

// Generate prompts for BattleRoute route assets
export function generateRouteAssetPrompt(assetName: string): string {
  return `Minimalist Grab-like ride-hailing ${assetName.toLowerCase()} icon, simple geometric shapes, solid green white and dark grey, clean sharp edges, no gradients, no complex shadows, iconic abstract ${assetName.toLowerCase()} symbol`
}

// Generate prompts for BattleRoute attack icons
export function generateAttackIconPrompt(attackName: string): string {
  return `Minimalist Grab-like ${attackName.toLowerCase()} icon, simple geometric shapes, solid green white and dark grey, clean sharp edges, abstract route-tracking symbol, professional mobile app style`
}

// Generate FareMon creature prompt
export function generateFareMonCreaturePrompt(creatureName: string, creatureType: string): string {
  return `AI-generated ${creatureName} creature for mobile battle game, ${creatureType} themed, ride-hailing inspired design, simple stylized art, green and white color scheme, no copyrighted elements, mobile game ready`
}

// Alias for backwards compatibility
export const generateFareMonPrompt = generateFareMonCreaturePrompt

// Generate FareMon move icon prompt
export function generateFareMonMovePrompt(moveName: string, moveType: string): string {
  return `Minimalist ${moveType.toLowerCase()} move icon named ${moveName}, simple geometric shapes, ${moveType === 'Attack' ? 'red accent' : moveType === 'Defense' ? 'blue accent' : moveType === 'Strategy' ? 'amber accent' : 'purple accent'}, clean sharp edges, mobile game ready`
}

// Route asset metadata for BattleRoute
export const battleRouteAssets: AIIconMetadata[] = [
  mockAIIconGenerator('Driver Van', 'vehicle'),
  mockAIIconGenerator('EV Shuttle', 'vehicle'),
  mockAIIconGenerator('Taxi Pod', 'vehicle'),
  mockAIIconGenerator('Bike Courier', 'vehicle'),
  mockAIIconGenerator('Route Hub', 'route'),
]

// Attack icons for BattleRoute
export const battleRouteAttacks: AIIconMetadata[] = [
  mockAIIconGenerator('Route Ping', 'action'),
  mockAIIconGenerator('Fare Strike', 'action'),
  mockAIIconGenerator('Surge Scan', 'action'),
  mockAIIconGenerator('Driver Dispatch', 'action'),
]

// Home screen illustration prompt
export const homeIllustrationPrompt = 
  "Clean minimal ride-hailing illustration, simple geometric shapes, Grab-like green white and dark grey, professional vehicle abstraction, clean sharp edges, no complex shadows, no gradients, no hand-drawn texture, iconic car symbol, mobile app style"
