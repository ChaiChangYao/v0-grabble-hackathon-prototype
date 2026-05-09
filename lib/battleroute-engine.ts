// BattleRoute Game Engine - Battleship-inspired hidden-grid route attack game

export interface RouteAsset {
  id: string
  name: string
  length: number
  icon: string // CSS class for icon fallback
}

export interface PlacedAsset {
  asset: RouteAsset
  startRow: number
  startCol: number
  isHorizontal: boolean
  hits: boolean[] // Track which cells are hit
}

export interface BattleRoutePlayerState {
  placedAssets: PlacedAsset[]
  grid: ('empty' | 'asset' | 'hit' | 'miss')[][]
  attackGrid: ('unknown' | 'hit' | 'miss')[][] // What player sees of opponent
  placementComplete: boolean
  assetsRemaining: number // Count of unhit asset cells
}

export interface BattleRouteState {
  player1: BattleRoutePlayerState
  player2: BattleRoutePlayerState
  phase: 'placement' | 'attack'
  currentTurn: 1 | 2
  attackLog: { player: 1 | 2; row: number; col: number; result: 'hit' | 'miss' }[]
  gameOver: boolean
  winner: 1 | 2 | null
  aiGenerating: boolean
}

// Route assets - ride-hailing themed instead of naval
export const routeAssets: RouteAsset[] = [
  { id: 'driver-van', name: 'Driver Van', length: 3, icon: 'van' },
  { id: 'ev-shuttle', name: 'EV Shuttle', length: 3, icon: 'shuttle' },
  { id: 'taxi-pod', name: 'Taxi Pod', length: 2, icon: 'taxi' },
  { id: 'bike-courier', name: 'Bike Courier', length: 2, icon: 'bike' },
  { id: 'route-hub', name: 'Route Hub', length: 1, icon: 'hub' },
]

// Create empty 6x6 grid
function createEmptyGrid(): ('empty' | 'asset' | 'hit' | 'miss')[][] {
  return Array(6).fill(null).map(() => Array(6).fill('empty'))
}

function createEmptyAttackGrid(): ('unknown' | 'hit' | 'miss')[][] {
  return Array(6).fill(null).map(() => Array(6).fill('unknown'))
}

// Initialize player state
function createInitialPlayerState(): BattleRoutePlayerState {
  return {
    placedAssets: [],
    grid: createEmptyGrid(),
    attackGrid: createEmptyAttackGrid(),
    placementComplete: false,
    assetsRemaining: routeAssets.reduce((sum, a) => sum + a.length, 0), // 3+3+2+2+1 = 11 cells
  }
}

// Initialize BattleRoute state
export function createBattleRouteState(): BattleRouteState {
  return {
    player1: createInitialPlayerState(),
    player2: createInitialPlayerState(),
    phase: 'placement',
    currentTurn: 1,
    attackLog: [],
    gameOver: false,
    winner: null,
    aiGenerating: false,
  }
}

// Validate if asset can be placed at position
export function validateRoutePlacement(
  playerState: BattleRoutePlayerState,
  asset: RouteAsset,
  startRow: number,
  startCol: number,
  isHorizontal: boolean
): boolean {
  // Check if asset already placed
  if (playerState.placedAssets.some(p => p.asset.id === asset.id)) {
    return false
  }
  
  // Check bounds
  if (isHorizontal) {
    if (startCol + asset.length > 6) return false
  } else {
    if (startRow + asset.length > 6) return false
  }
  
  // Check overlap with existing assets
  for (let i = 0; i < asset.length; i++) {
    const row = isHorizontal ? startRow : startRow + i
    const col = isHorizontal ? startCol + i : startCol
    if (playerState.grid[row][col] !== 'empty') {
      return false
    }
  }
  
  return true
}

// Place route asset on grid
export function placeRouteAsset(
  state: BattleRouteState,
  playerId: 1 | 2,
  asset: RouteAsset,
  startRow: number,
  startCol: number,
  isHorizontal: boolean
): BattleRouteState {
  const playerKey = playerId === 1 ? 'player1' : 'player2'
  const playerState = { ...state[playerKey] }
  
  if (!validateRoutePlacement(playerState, asset, startRow, startCol, isHorizontal)) {
    return state // Invalid placement, return unchanged
  }
  
  // Update grid
  const newGrid = playerState.grid.map(row => [...row])
  for (let i = 0; i < asset.length; i++) {
    const row = isHorizontal ? startRow : startRow + i
    const col = isHorizontal ? startCol + i : startCol
    newGrid[row][col] = 'asset'
  }
  
  // Add to placed assets
  const newPlacedAssets = [
    ...playerState.placedAssets,
    {
      asset,
      startRow,
      startCol,
      isHorizontal,
      hits: Array(asset.length).fill(false),
    },
  ]
  
  // Check if all assets placed
  const placementComplete = newPlacedAssets.length === routeAssets.length
  
  return {
    ...state,
    [playerKey]: {
      ...playerState,
      grid: newGrid,
      placedAssets: newPlacedAssets,
      placementComplete,
    },
    // Check if both players done with placement
    phase: placementComplete && state[playerId === 1 ? 'player2' : 'player1'].placementComplete
      ? 'attack'
      : state.phase,
  }
}

// Rotate asset (toggle horizontal/vertical)
export function rotateRouteAsset(isHorizontal: boolean): boolean {
  return !isHorizontal
}

// Submit attack on opponent grid
export function submitRouteAttack(
  state: BattleRouteState,
  attackingPlayer: 1 | 2,
  row: number,
  col: number
): BattleRouteState {
  if (state.phase !== 'attack' || state.currentTurn !== attackingPlayer) {
    return state
  }
  
  const attackerKey = attackingPlayer === 1 ? 'player1' : 'player2'
  const defenderKey = attackingPlayer === 1 ? 'player2' : 'player1'
  
  const attacker = { ...state[attackerKey] }
  const defender = { ...state[defenderKey] }
  
  // Check if already attacked this cell
  if (attacker.attackGrid[row][col] !== 'unknown') {
    return state
  }
  
  // Check hit or miss
  const isHit = defender.grid[row][col] === 'asset'
  const result: 'hit' | 'miss' = isHit ? 'hit' : 'miss'
  
  // Update attacker's view of opponent grid
  const newAttackGrid = attacker.attackGrid.map(r => [...r])
  newAttackGrid[row][col] = result
  attacker.attackGrid = newAttackGrid
  
  // Update defender's grid and track hits
  const newDefenderGrid = defender.grid.map(r => [...r])
  if (isHit) {
    newDefenderGrid[row][col] = 'hit'
    defender.assetsRemaining -= 1
    
    // Mark hit on the specific asset
    defender.placedAssets = defender.placedAssets.map(pa => {
      const newHits = [...pa.hits]
      for (let i = 0; i < pa.asset.length; i++) {
        const assetRow = pa.isHorizontal ? pa.startRow : pa.startRow + i
        const assetCol = pa.isHorizontal ? pa.startCol + i : pa.startCol
        if (assetRow === row && assetCol === col) {
          newHits[i] = true
        }
      }
      return { ...pa, hits: newHits }
    })
  } else {
    newDefenderGrid[row][col] = 'miss'
  }
  defender.grid = newDefenderGrid
  
  // Add to attack log
  const newAttackLog = [...state.attackLog, { player: attackingPlayer, row, col, result }]
  
  // Check win condition
  const gameOver = defender.assetsRemaining === 0
  const winner = gameOver ? attackingPlayer : null
  
  return {
    ...state,
    [attackerKey]: attacker,
    [defenderKey]: defender,
    attackLog: newAttackLog,
    currentTurn: attackingPlayer === 1 ? 2 : 1,
    gameOver,
    winner,
  }
}

// Check if coordinate hits or misses
export function checkHitOrMiss(
  defenderState: BattleRoutePlayerState,
  row: number,
  col: number
): 'hit' | 'miss' {
  return defenderState.grid[row][col] === 'asset' ? 'hit' : 'miss'
}

// Check if all assets are destroyed
export function checkAllAssetsDestroyed(playerState: BattleRoutePlayerState): boolean {
  return playerState.assetsRemaining === 0
}

// Determine winner
export function determineBattleRouteWinner(state: BattleRouteState): 1 | 2 | null {
  if (state.player2.assetsRemaining === 0) return 1
  if (state.player1.assetsRemaining === 0) return 2
  return null
}

// Get player's perspective (what they can see)
export function getBattleRoutePlayerPerspective(
  state: BattleRouteState,
  playerId: 1 | 2
): {
  ownGrid: ('empty' | 'asset' | 'hit' | 'miss')[][]
  opponentGrid: ('unknown' | 'hit' | 'miss')[][]
  placedAssets: PlacedAsset[]
  phase: 'placement' | 'attack'
  isMyTurn: boolean
  assetsToPlace: RouteAsset[]
} {
  const playerKey = playerId === 1 ? 'player1' : 'player2'
  const playerState = state[playerKey]
  
  return {
    ownGrid: playerState.grid,
    opponentGrid: playerState.attackGrid,
    placedAssets: playerState.placedAssets,
    phase: state.phase,
    isMyTurn: state.currentTurn === playerId,
    assetsToPlace: routeAssets.filter(
      a => !playerState.placedAssets.some(p => p.asset.id === a.id)
    ),
  }
}

// Get remaining assets for a player (not yet destroyed)
export function getRemainingAssets(playerState: BattleRoutePlayerState): PlacedAsset[] {
  return playerState.placedAssets.filter(pa => !pa.hits.every(h => h))
}

// Check if specific asset is destroyed
export function isAssetDestroyed(placedAsset: PlacedAsset): boolean {
  return placedAsset.hits.every(h => h)
}
