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

interface GameStore extends GameState {
  // Grid valid coordinates for rendering
  validCoords: HexCoord[];
  
  // Current game mode
  gameMode: GameMode;
  
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
    
    // Game actions
    moveInDirection: (direction: Direction) => {
      const currentState = get();
      if (currentState.isGameOver || currentState.isWon) return;
      
      const newState = coreMove(currentState, direction);
      set(newState);
    },
    
    undoMove: () => {
      const currentState = get();
      const newState = coreUndo(currentState);
      set(newState);
    },
    
    resetGame: () => {
      const currentState = get();
      const newState = coreReset(currentState);
      
      // Set the appropriate undo limit based on game mode
      const modeConfig = GAME_MODES[get().gameMode];
      
      set({
        ...newState,
        undosRemaining: modeConfig.undoLimit,
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
      });
    },
  };
});

export default useGameStore; 