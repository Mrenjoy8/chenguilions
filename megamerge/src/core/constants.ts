import { GameMode, TileValue } from './types';

/**
 * Hex grid configuration
 */
export const GRID_SIZE = 5; // Width of the grid (in hexagons)
export const TOTAL_TILES = 37; // Total number of tiles in a 5-wide hex grid

/**
 * Visual configurations
 */
export const HEX_SIZE = 50; // Size of hex tiles in pixels
export const HEX_SPACING = 4; // Space between hex tiles in pixels

/**
 * Game progression values
 */
export const TILE_VALUES: TileValue[] = [
  2, 6, 18, 54, 162, 486, 1458, 4374, 13122, 39366, 118098, 354294, 1062882
];

/**
 * Get the next value in the progression
 */
export const getNextValue = (value: TileValue): TileValue | undefined => {
  const index = TILE_VALUES.indexOf(value);
  if (index === -1 || index === TILE_VALUES.length - 1) {
    return undefined;
  }
  return TILE_VALUES[index + 1];
};

/**
 * Maps tile values to their colors (referenced in tailwind.config.js)
 */
export const TILE_COLORS: Record<TileValue, string> = {
  2: 'bg-tile-2 text-gray-700',
  6: 'bg-tile-6 text-gray-700',
  18: 'bg-tile-18 text-gray-700',
  54: 'bg-tile-54 text-gray-700',
  162: 'bg-tile-162 text-white',
  486: 'bg-tile-486 text-white',
  1458: 'bg-tile-1458 text-gray-700',
  4374: 'bg-tile-4374 text-gray-700',
  13122: 'bg-tile-13122 text-gray-700',
  39366: 'bg-tile-39366 text-gray-700',
  118098: 'bg-tile-118098 text-gray-700',
  354294: 'bg-tile-354294 text-white',
  1062882: 'bg-tile-1062882 text-white',
};

/**
 * Game mode configurations
 */
export const GAME_MODES = {
  [GameMode.CLASSIC]: {
    mode: GameMode.CLASSIC,
    undoLimit: 3,
    winningTile: 1062882 as TileValue,
  },
  [GameMode.TIME_TRIAL]: {
    mode: GameMode.TIME_TRIAL,
    timerDuration: 60, // 60 seconds
    undoLimit: 0, // No undos in time trial
    winningTile: 1062882 as TileValue,
  },
  [GameMode.FAST_PACE]: {
    mode: GameMode.FAST_PACE,
    autoSpawnInterval: 1000, // 1 second
    undoLimit: 0, // No undos in fast pace
    winningTile: 1062882 as TileValue,
  },
}; 