import {
  FareMonState,
  FareMonMove,
  FareBlocksState,
  FareBlocksPlayerState,
  BlockPiece,
  player1Creature,
  player2Creature,
  blockPieces,
  trafficModifiers,
  fareBlocksHints,
  fareMonCommentary,
} from './grabble-types'

// Initialize FareMon state
export function createInitialFareMonState(): FareMonState {
  return {
    player1Creature: { ...player1Creature },
    player2Creature: { ...player2Creature },
    currentTurn: 1,
    maxTurns: 5,
    player1Move: null,
    player2Move: null,
    battleLog: [],
    aiCommentary: 'AI Commentator: The battle is about to begin!',
    gameOver: false,
    winner: null,
  }
}

// Create empty grid for Fare Blocks
function createEmptyGrid(): boolean[][] {
  return Array(6).fill(null).map(() => Array(6).fill(false))
}

// Initialize Fare Blocks player state
function createInitialPlayerState(): FareBlocksPlayerState {
  return {
    grid: createEmptyGrid(),
    score: 0,
    surgePressure: 50,
    movesRemaining: 8,
    selectedPiece: null,
  }
}

// Initialize Fare Blocks state
export function createInitialFareBlocksState(): FareBlocksState {
  const modifier = trafficModifiers[Math.floor(Math.random() * trafficModifiers.length)]
  return {
    player1: createInitialPlayerState(),
    player2: createInitialPlayerState(),
    availablePieces: [...blockPieces],
    currentPieceIndex: 0,
    aiHint: fareBlocksHints[0],
    modifier,
    gameOver: false,
    winner: null,
  }
}

// Apply FareMon move effect
export function applyMoveEffect(
  state: FareMonState,
  playerId: 1 | 2,
  move: FareMonMove
): FareMonState {
  const newState = { ...state }
  const attacker = playerId === 1 ? 'player1Creature' : 'player2Creature'
  const defender = playerId === 1 ? 'player2Creature' : 'player1Creature'
  
  newState[attacker] = { ...newState[attacker] }
  newState[defender] = { ...newState[defender] }

  switch (move.type) {
    case 'Attack': {
      let damage = 18
      const shield = newState[defender].shield
      const actualDamage = Math.max(0, damage - shield)
      newState[defender].hp = Math.max(0, newState[defender].hp - actualDamage)
      newState[defender].shield = Math.max(0, shield - damage)
      newState.battleLog = [...newState.battleLog, `${newState[attacker].name} used ${move.name}! Dealt ${actualDamage} damage.`]
      break
    }
    case 'Defense': {
      newState[attacker].shield += 15
      newState.battleLog = [...newState.battleLog, `${newState[attacker].name} used ${move.name}! Shield increased to ${newState[attacker].shield}.`]
      break
    }
    case 'Strategy': {
      let damage = 8
      const shield = newState[defender].shield
      const actualDamage = Math.max(0, damage - shield)
      newState[defender].hp = Math.max(0, newState[defender].hp - actualDamage)
      newState[defender].shield = Math.max(0, shield - damage)
      newState[defender].farePressure = Math.min(100, newState[defender].farePressure + 15)
      newState.battleLog = [...newState.battleLog, `${newState[attacker].name} used ${move.name}! Dealt ${actualDamage} damage and increased fare pressure.`]
      break
    }
    case 'Power': {
      const success = Math.random() > 0.5
      if (success) {
        let damage = 35
        const shield = newState[defender].shield
        const actualDamage = Math.max(0, damage - shield)
        newState[defender].hp = Math.max(0, newState[defender].hp - actualDamage)
        newState[defender].shield = Math.max(0, shield - damage)
        newState.battleLog = [...newState.battleLog, `${newState[attacker].name} used ${move.name}! Critical hit! Dealt ${actualDamage} damage!`]
      } else {
        newState[attacker].hp = Math.max(0, newState[attacker].hp - 10)
        newState.battleLog = [...newState.battleLog, `${newState[attacker].name} used ${move.name}! It backfired! Took 10 self-damage.`]
      }
      break
    }
  }

  return newState
}

// Resolve FareMon turn
export function resolveFareMonTurn(state: FareMonState): FareMonState {
  if (!state.player1Move || !state.player2Move) return state
  
  let newState = { ...state }
  
  // Apply both moves
  newState = applyMoveEffect(newState, 1, state.player1Move)
  newState = applyMoveEffect(newState, 2, state.player2Move)
  
  // Clear shields after turn (they only last one turn)
  newState.player1Creature = { ...newState.player1Creature, shield: 0 }
  newState.player2Creature = { ...newState.player2Creature, shield: 0 }
  
  // Add AI commentary
  newState.aiCommentary = `AI Commentator: ${fareMonCommentary[Math.floor(Math.random() * fareMonCommentary.length)]}`
  
  // Check for winner
  if (newState.player1Creature.hp <= 0 || newState.player2Creature.hp <= 0) {
    newState.gameOver = true
    newState.winner = newState.player1Creature.hp > newState.player2Creature.hp ? 1 : 2
  } else if (newState.currentTurn >= newState.maxTurns) {
    newState.gameOver = true
    // Determine winner by HP, then fare pressure
    if (newState.player1Creature.hp !== newState.player2Creature.hp) {
      newState.winner = newState.player1Creature.hp > newState.player2Creature.hp ? 1 : 2
    } else if (newState.player1Creature.farePressure !== newState.player2Creature.farePressure) {
      newState.winner = newState.player1Creature.farePressure < newState.player2Creature.farePressure ? 1 : 2
    } else {
      newState.winner = Math.random() > 0.5 ? 1 : 2
    }
  }
  
  // Reset moves and advance turn
  newState.player1Move = null
  newState.player2Move = null
  newState.currentTurn += 1
  
  return newState
}

// Determine FareMon winner
export function determineFareMonWinner(state: FareMonState): 1 | 2 {
  if (state.player1Creature.hp > state.player2Creature.hp) return 1
  if (state.player2Creature.hp > state.player1Creature.hp) return 2
  if (state.player1Creature.farePressure < state.player2Creature.farePressure) return 1
  if (state.player2Creature.farePressure < state.player1Creature.farePressure) return 2
  return Math.random() > 0.5 ? 1 : 2
}

// Check if piece can be placed
export function canPlacePiece(grid: boolean[][], piece: BlockPiece, row: number, col: number): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const gridRow = row + r
        const gridCol = col + c
        if (gridRow >= 6 || gridCol >= 6 || grid[gridRow][gridCol]) {
          return false
        }
      }
    }
  }
  return true
}

// Place piece on grid
export function placePiece(grid: boolean[][], piece: BlockPiece, row: number, col: number): boolean[][] {
  const newGrid = grid.map(r => [...r])
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        newGrid[row + r][col + c] = true
      }
    }
  }
  return newGrid
}

// Clear completed lines and return score
export function clearCompletedLines(grid: boolean[][]): { grid: boolean[][], rowsCleared: number, colsCleared: number } {
  const newGrid = grid.map(r => [...r])
  let rowsCleared = 0
  let colsCleared = 0
  
  // Check rows
  const rowsToClear: number[] = []
  for (let r = 0; r < 6; r++) {
    if (newGrid[r].every(cell => cell)) {
      rowsToClear.push(r)
      rowsCleared++
    }
  }
  
  // Check columns
  const colsToClear: number[] = []
  for (let c = 0; c < 6; c++) {
    if (newGrid.every(row => row[c])) {
      colsToClear.push(c)
      colsCleared++
    }
  }
  
  // Clear rows
  rowsToClear.forEach(r => {
    for (let c = 0; c < 6; c++) {
      newGrid[r][c] = false
    }
  })
  
  // Clear columns
  colsToClear.forEach(c => {
    for (let r = 0; r < 6; r++) {
      newGrid[r][c] = false
    }
  })
  
  return { grid: newGrid, rowsCleared, colsCleared }
}

// Calculate score for Fare Blocks placement
export function calculateFareBlocksScore(
  piece: BlockPiece,
  rowsCleared: number,
  colsCleared: number,
  modifier: string
): number {
  let score = 0
  
  // Base score for tiles
  const tileCount = piece.shape.flat().filter(Boolean).length
  score += tileCount * 10
  
  // Row clear bonus
  score += rowsCleared * 60
  if (modifier === 'ERP Rush') {
    score += colsCleared * 20 // Extra column bonus
  } else {
    score += colsCleared * 60
  }
  
  // Combo bonus
  if (rowsCleared > 0 && colsCleared > 0) {
    score += 150
  }
  
  return score
}

// Update surge pressure
export function updateSurgePressure(
  currentPressure: number,
  isValidPlacement: boolean,
  rowsCleared: number,
  colsCleared: number,
  modifier: string
): number {
  let pressure = currentPressure
  
  if (isValidPlacement) {
    pressure -= 2
    pressure -= rowsCleared * 10
    pressure -= colsCleared * 10
    
    if (modifier === 'Airport Demand' && rowsCleared > 0 && colsCleared > 0) {
      pressure -= 8 // Extra combo pressure reduction
    }
  } else {
    if (modifier === 'Rain Surge') {
      pressure += 10
    } else {
      pressure += 8
    }
  }
  
  return Math.max(0, Math.min(100, pressure))
}

// Determine Fare Blocks winner
export function determineFareBlocksWinner(state: FareBlocksState): 1 | 2 {
  if (state.player1.score > state.player2.score) return 1
  if (state.player2.score > state.player1.score) return 2
  if (state.player1.surgePressure < state.player2.surgePressure) return 1
  if (state.player2.surgePressure < state.player1.surgePressure) return 2
  return Math.random() > 0.5 ? 1 : 2
}

// Generate AI hint for Fare Blocks
export function generateFareBlocksAIHint(): string {
  return `AI Hint: ${fareBlocksHints[Math.floor(Math.random() * fareBlocksHints.length)]}`
}

// Generate AI commentary for FareMon
export function generateFareMonAICommentary(): string {
  return `AI Commentator: ${fareMonCommentary[Math.floor(Math.random() * fareMonCommentary.length)]}`
}

// Get next available pieces (3 at a time)
export function getNextPieces(state: FareBlocksState): BlockPiece[] {
  const pieces: BlockPiece[] = []
  for (let i = 0; i < 3; i++) {
    const index = (state.currentPieceIndex + i) % blockPieces.length
    pieces.push(blockPieces[index])
  }
  return pieces
}
