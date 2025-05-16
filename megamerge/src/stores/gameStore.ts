import { create } from 'zustand';
import { GameState, Direction, GameMode, HexCoord } from '../core/types';
import { 
  initializeGameState, 
  moveInDirection as coreMove, 
  undoMove as coreUndo,
  resetGame as coreReset
} from '../core/game';
import { getAllGridCoords } from '../core/hexUtils';
import { GAME_MODES } from '../core/constants';
// import { findAllTriplets } from '../core/mergeLogic';

interface GameStore extends GameState {
  // Grid valid coordinates for rendering
  validCoords: HexCoord[];
  
  // Current game mode
  gameMode: GameMode;
  
  // Track the IDs of the last 3 tiles that merged
  lastMergeTriplet: string[] | null;
  
  // Actions
  moveInDirection: (direction: Direction) => void;
  undoMove: () => void;
  resetGame: () => void;
  setGameMode: (mode: GameMode) => void;
}

const useGameStore = create<GameStore>((set, get) => {
  // Initialize game with default state
  const initialState = initializeGameState();
  
  return {
    // Spread initial state
    ...initialState,
    
    // Default game mode
    gameMode: GameMode.CLASSIC,
    
    // Pre-calculated valid coordinates for the grid
    validCoords: getAllGridCoords(),
    
    // Initialize lastMergeTriplet as null
    lastMergeTriplet: null,
    
    // Game actions
    moveInDirection: (direction: Direction) => {
      const currentState = get();
      if (currentState.isGameOver || currentState.isWon) return;
      
      // Get triplets before the move to compare after
      // const beforeTriplets = findAllTriplets(currentState.grid);
      const beforeTileIds = new Set(currentState.grid.map(tile => tile.id));
      
      const newState = coreMove(currentState, direction);
      
      // Check for newly merged tiles
      const newlyMergedTiles = newState.grid.filter(tile => tile.isMerged);
      
      // Find the tiles that were used in the merge by looking for tiles that existed before but not after
      if (newlyMergedTiles.length > 0) {
        const afterTileIds = new Set(newState.grid.map(tile => tile.id));
        const removedTileIds = Array.from(beforeTileIds).filter(id => !afterTileIds.has(id));
        
        // If exactly 3 tiles were removed and a merge occurred, track them as the last merge triplet
        if (removedTileIds.length === 3 && newlyMergedTiles.length > 0) {
          set({
            ...newState,
            lastMergeTriplet: removedTileIds
          });
        } else {
          set({
            ...newState,
            lastMergeTriplet: null
          });
        }
      } else {
        set({
          ...newState,
          lastMergeTriplet: null
        });
      }
    },
    
    undoMove: () => {
      const currentState = get();
      const newState = coreUndo(currentState);
      set({
        ...newState,
        lastMergeTriplet: null
      });
    },
    
    resetGame: () => {
      const currentState = get();
      const newState = coreReset(currentState);
      
      // Set the appropriate undo limit based on game mode
      const modeConfig = GAME_MODES[get().gameMode];
      
      set({
        ...newState,
        undosRemaining: modeConfig.undoLimit,
        lastMergeTriplet: null
      });
    },
    
    setGameMode: (mode: GameMode) => {
      const currentState = get();
      const modeConfig = GAME_MODES[mode];
      
      // Reset the game with the new mode settings
      const newState = coreReset(currentState);
      
      set({
        ...newState,
        gameMode: mode,
        undosRemaining: modeConfig.undoLimit,
        lastMergeTriplet: null
      });
    },
  };
});

export default useGameStore; 