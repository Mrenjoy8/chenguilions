import { Tile, /* HexCoord, */ Direction, TileValue, GameState } from './types';
// import { GRID_SIZE, TILE_VALUES } from './constants';
import { 
  getAllGridCoords, 
  /* isValidCoord, */
  coordsEqual, 
  /* addCoords, */
  getAllLines 
} from './hexUtils';
import { 
  getTileAtCoord,
  canMergeAnywhere,
  resolveAllMerges,
  /* resetMergeFlags */
} from './mergeLogic';

/**
 * Initializes a new empty grid
 */
export const initializeGrid = (): Tile[] => {
  // Start with an empty grid
  return [];
};

/**
 * Adds a new tile to the grid at a random empty position
 */
export const addRandomTile = (grid: Tile[]): Tile[] => {
  const allCoords = getAllGridCoords();
  const emptyCoords = allCoords.filter(coord => 
    !grid.some(tile => coordsEqual(tile.position, coord))
  );
  
  if (emptyCoords.length === 0) {
    return grid; // No empty spaces
  }
  
  // Pick a random empty position
  const randomIndex = Math.floor(Math.random() * emptyCoords.length);
  const position = emptyCoords[randomIndex];
  
  // Generate a new tile (90% chance of value 2, 10% chance of value 6)
  const value: TileValue = Math.random() < 0.9 ? 2 : 6;
  
  const newTile: Tile = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    value,
    position,
    isNew: true,
    isMerged: false
  };
  
  return [...grid, newTile];
};

/**
 * Creates a new game state
 */
export const initializeGameState = (): GameState => {
  // Start with an empty grid
  let grid = initializeGrid();
  
  // Add several starter tiles to make the game more interesting
  // Add 5 initial tiles instead of just 2
  for (let i = 0; i < 5; i++) {
    grid = addRandomTile(grid);
  }
  
  return {
    grid,
    score: 0,
    bestScore: 0,
    isGameOver: false,
    isWon: false,
    canUndo: false,
    history: [],
    undosRemaining: 3,
  };
};

/**
 * Moves tiles in a direction and handles merges
 */
export const moveInDirection = (
  gameState: GameState, 
  direction: Direction
): GameState => {
  // Save current state for undo
  const prevState = {
    grid: gameState.grid,
    score: gameState.score,
  };
  
  // Reset merged flags and set isNew to false from previous moves
  const resetGrid = gameState.grid.map(tile => ({
    ...tile,
    isNew: false,
    isMerged: false,
  }));
  
  // Get all lines in the direction of movement
  const lines = getAllLines(direction);
  
  // Process each line to move tiles
  let movedGrid = [...resetGrid];
  let moved = false;
  
  for (const line of lines) {
    // Get all tiles in this line
    const tilesInLine = line
      .map(coord => getTileAtCoord(movedGrid, coord))
      .filter((tile): tile is Tile => !!tile);
    
    if (tilesInLine.length === 0) continue;
    
    // Remove tiles from this line from the grid
    movedGrid = movedGrid.filter(tile => 
      !tilesInLine.some(lineTile => lineTile.id === tile.id)
    );
    
    // Place tiles at the furthest possible position in the line
    for (let i = 0; i < tilesInLine.length; i++) {
      const targetPosition = line[i];
      const tile = tilesInLine[i];
      
      if (!coordsEqual(tile.position, targetPosition)) {
        moved = true;
      }
      
      // Update tile position - ensure isNew and isMerged are defined
      movedGrid.push({
        id: tile.id,
        value: tile.value,
        position: targetPosition,
        isNew: tile.isNew || false,
        isMerged: tile.isMerged || false
      });
    }
  }
  
  // If no tiles moved, return the original state
  if (!moved) {
    return gameState;
  }
  
  // Check for and resolve merges
  const { grid: mergedGrid, scoreIncrease } = resolveAllMerges(movedGrid);
  
  // Add a new random tile
  const newGrid = addRandomTile(mergedGrid);
  
  // Check for game over or win conditions
  const emptyCells = getAllGridCoords().filter(coord => 
    !newGrid.some(tile => coordsEqual(tile.position, coord))
  ).length;
  
  const highestTile = newGrid.reduce<number>(
    (highest, tile) => Math.max(highest, tile.value), 
    0
  ) as TileValue;
  
  const isWon = highestTile >= 1062882; // Winning tile value
  const canStillMerge = canMergeAnywhere(newGrid);
  const isGameOver = emptyCells === 0 && !canStillMerge;
  
  return {
    ...gameState,
    grid: newGrid,
    score: gameState.score + scoreIncrease,
    bestScore: Math.max(gameState.bestScore, gameState.score + scoreIncrease),
    isWon,
    isGameOver,
    canUndo: true,
    history: [...gameState.history, prevState],
  };
};

/**
 * Undoes the last move if possible
 */
export const undoMove = (gameState: GameState): GameState => {
  if (!gameState.canUndo || gameState.history.length === 0 || gameState.undosRemaining <= 0) {
    return gameState;
  }
  
  const lastState = gameState.history[gameState.history.length - 1];
  const newHistory = gameState.history.slice(0, -1);
  
  return {
    ...gameState,
    grid: lastState.grid,
    score: lastState.score,
    isGameOver: false, // Undo can never lead to game over
    isWon: false, // Also reset win state
    canUndo: newHistory.length > 0,
    history: newHistory,
    undosRemaining: gameState.undosRemaining - 1,
  };
};

/**
 * Resets the game to a fresh state
 */
export const resetGame = (gameState: GameState): GameState => {
  return {
    ...initializeGameState(),
    bestScore: gameState.bestScore, // Preserve best score
  };
};

/**
 * Checks if there are any valid moves left
 */
export const hasValidMoves = (grid: Tile[]): boolean => {
  // Check if there are any empty cells
  const allCoords = getAllGridCoords();
  const emptyCells = allCoords.filter(coord => 
    !grid.some(tile => coordsEqual(tile.position, coord))
  ).length;
  
  if (emptyCells > 0) {
    return true;
  }
  
  // Check if any merges are possible
  return canMergeAnywhere(grid);
}; 