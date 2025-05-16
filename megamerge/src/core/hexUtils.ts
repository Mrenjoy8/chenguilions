import { HexCoord, Direction } from './types';
import { GRID_SIZE } from './constants';

/**
 * Directions for moving in the hex grid using axial coordinates
 * Order corresponds to the Direction enum
 */
export const DIRECTION_VECTORS: HexCoord[] = [
  { q: -1, r: 1 },  // NORTHEAST
  { q: -1, r: 0 },  // EAST
  { q: 0, r: -1 },  // SOUTHEAST
  { q: 1, r: -1 },  // SOUTHWEST
  { q: 1, r: 0 },   // WEST
  { q: 0, r: 1 },   // NORTHWEST
];

/**
 * Adds two hex coordinates
 */
export const addCoords = (a: HexCoord, b: HexCoord): HexCoord => ({
  q: a.q + b.q,
  r: a.r + b.r,
});

/**
 * Gets the third coordinate (s) in the cube coordinate system
 * In cube coordinates, q + r + s = 0
 */
export const getS = (coord: HexCoord): number => -coord.q - coord.r;

/**
 * Calculates the distance between two hex coordinates
 */
export const hexDistance = (a: HexCoord, b: HexCoord): number => {
  const aCube = { q: a.q, r: a.r, s: getS(a) };
  const bCube = { q: b.q, r: b.r, s: getS(b) };
  return Math.max(
    Math.abs(aCube.q - bCube.q),
    Math.abs(aCube.r - bCube.r),
    Math.abs(aCube.s - bCube.s)
  );
};

/**
 * Checks if two coordinates are equal
 */
export const coordsEqual = (a: HexCoord, b: HexCoord): boolean => {
  return a.q === b.q && a.r === b.r;
};

/**
 * Gets all valid coordinates for a hex grid of the specified size
 */
export const getAllGridCoords = (): HexCoord[] => {
  const coords: HexCoord[] = [];
  const radius = Math.floor(GRID_SIZE / 2);
  
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    
    for (let r = r1; r <= r2; r++) {
      coords.push({ q, r });
    }
  }
  
  return coords;
};

/**
 * Gets the neighbors of a hex coordinate
 */
export const getNeighbors = (coord: HexCoord): HexCoord[] => {
  return DIRECTION_VECTORS.map(dir => addCoords(coord, dir));
};

/**
 * Checks if a coordinate is within the grid bounds
 */
export const isValidCoord = (coord: HexCoord): boolean => {
  const radius = Math.floor(GRID_SIZE / 2);
  const s = getS(coord);
  return (
    Math.abs(coord.q) <= radius &&
    Math.abs(coord.r) <= radius &&
    Math.abs(s) <= radius
  );
};

/**
 * Converts axial coordinates to pixel position for rendering
 */
export const hexToPixel = (coord: HexCoord, hexSize: number): { x: number, y: number } => {
  // Standard conversion from axial coordinates to pixel coordinates
  // This formula ensures tiles are properly positioned in a hexagonal grid
  const x = hexSize * (Math.sqrt(3) * coord.q + Math.sqrt(3)/2 * coord.r);
  const y = hexSize * (3/2 * coord.r);
  return { x, y };
};

/**
 * Gets the line of coordinates in a given direction from a starting point
 * Useful for finding all tiles that might move during a swipe
 */
export const getLine = (start: HexCoord, direction: Direction): HexCoord[] => {
  const dir = DIRECTION_VECTORS[direction];
  const result: HexCoord[] = [start];
  let current = start;
  
  while (true) {
    const next = addCoords(current, dir);
    if (!isValidCoord(next)) break;
    
    result.push(next);
    current = next;
  }
  
  return result;
};

/**
 * Returns all possible lines for a swipe in a given direction
 */
export const getAllLines = (direction: Direction): HexCoord[][] => {
  const allCoords = getAllGridCoords();
  const lines: HexCoord[][] = [];
  const used = new Set<string>();
  
  // Function to create a key for a coordinate to use in the Set
  const coordKey = (coord: HexCoord) => `${coord.q},${coord.r}`;
  
  for (const coord of allCoords) {
    if (used.has(coordKey(coord))) continue;
    
    // Get the start of the line by going opposite to the direction
    let start = coord;
    const oppositeDir = (direction + 3) % 6;
    const oppositeDirVector = DIRECTION_VECTORS[oppositeDir];
    
    while (true) {
      const prev = addCoords(start, oppositeDirVector);
      if (!isValidCoord(prev)) break;
      start = prev;
    }
    
    // Now get the full line from this starting point
    const line = getLine(start, direction);
    
    // Mark all coords in this line as used
    line.forEach(c => used.add(coordKey(c)));
    
    lines.push(line);
  }
  
  return lines;
}; 