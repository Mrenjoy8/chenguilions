/**
 * Represents a position on the hexagonal grid using axial coordinates (q, r)
 * q: horizontal axis
 * r: diagonal axis
 */
export type HexCoord = {
  q: number;
  r: number;
};

/**
 * Possible values for tiles following the base-3 progression
 */
export type TileValue = 2 | 6 | 18 | 54 | 162 | 486 | 1458 | 4374 | 13122 | 39366 | 118098 | 354294 | 1062882;

/**
 * Represents a tile in the game
 */
export type Tile = {
  id: string;
  value: TileValue;
  position: HexCoord;
  isNew?: boolean;
  isMerged?: boolean;
};

/**
 * Directions for swipe movement
 * Each direction corresponds to 60° increments
 */
export enum Direction {
  NORTHEAST = 0, // Up-right
  EAST = 1,      // Right
  SOUTHEAST = 2, // Down-right
  SOUTHWEST = 3, // Down-left
  WEST = 4,      // Left
  NORTHWEST = 5, // Up-left
}

/**
 * Game state interface
 */
export interface GameState {
  grid: Tile[];
  score: number;
  bestScore: number;
  isGameOver: boolean;
  isWon: boolean;
  canUndo: boolean;
  history: {
    grid: Tile[];
    score: number;
  }[];
  undosRemaining: number;
}

/**
 * Available game modes
 */
export enum GameMode {
  CLASSIC = 'classic',
  TIME_TRIAL = 'timeTrials',
  FAST_PACE = 'fastPace',
}

/**
 * Game mode configuration
 */
export interface GameModeConfig {
  mode: GameMode;
  timerDuration?: number; // for TIME_TRIAL mode, in seconds
  autoSpawnInterval?: number; // for FAST_PACE mode, in milliseconds
  undoLimit: number;
  winningTile: TileValue;
} 