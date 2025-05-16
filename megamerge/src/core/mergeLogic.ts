import { Tile, HexCoord, /* TileValue */ } from './types';
import { coordsEqual, getNeighbors } from './hexUtils';
import { getNextValue } from './constants';

/**
 * Finds tiles at a specific coordinate
 */
export const getTileAtCoord = (grid: Tile[], coord: HexCoord): Tile | undefined => {
  return grid.find(tile => coordsEqual(tile.position, coord));
};

/**
 * Checks if three tiles with the same value are adjacent to each other
 */
export const findTripletsAt = (grid: Tile[], coord: HexCoord): Tile[] => {
  const centerTile = getTileAtCoord(grid, coord);
  if (!centerTile) return [];

  const neighbors = getNeighbors(coord);
  const matchingNeighbors = neighbors
    .map(pos => getTileAtCoord(grid, pos))
    .filter((tile): tile is Tile => !!tile && tile.value === centerTile.value);

  if (matchingNeighbors.length < 2) return [];

  // Check each pair of neighbors to see if they're adjacent to each other
  for (let i = 0; i < matchingNeighbors.length; i++) {
    for (let j = i + 1; j < matchingNeighbors.length; j++) {
      const tileA = matchingNeighbors[i];
      const tileB = matchingNeighbors[j];
      
      // Check if these two neighbors are also adjacent to each other
      const aNbrs = getNeighbors(tileA.position);
      if (aNbrs.some(nCoord => coordsEqual(nCoord, tileB.position))) {
        return [centerTile, tileA, tileB];
      }
    }
  }

  return [];
};

/**
 * Finds all sets of three adjacent tiles with the same value
 */
export const findAllTriplets = (grid: Tile[]): Tile[][] => {
  const triplets: Tile[][] = [];
  const checkedCoords = new Set<string>();

  const coordKey = (coord: HexCoord) => `${coord.q},${coord.r}`;

  for (const tile of grid) {
    const key = coordKey(tile.position);
    if (checkedCoords.has(key)) continue;
    
    checkedCoords.add(key);
    const triplet = findTripletsAt(grid, tile.position);
    
    if (triplet.length === 3) {
      // Add all triplet tiles to checked set to avoid duplicates
      triplet.forEach(t => checkedCoords.add(coordKey(t.position)));
      triplets.push(triplet);
    }
  }

  return triplets;
};

/**
 * Checks if a merge is possible anywhere on the grid
 */
export const canMergeAnywhere = (grid: Tile[]): boolean => {
  return findAllTriplets(grid).length > 0;
};

/**
 * Performs a merge of 3 tiles, returning the new grid and score increase
 */
export const mergeTriplet = (grid: Tile[], triplet: Tile[]): { grid: Tile[], scoreIncrease: number } => {
  if (triplet.length !== 3) {
    return { grid: [...grid], scoreIncrease: 0 };
  }

  const [tile1, tile2, tile3] = triplet;
  const oldValue = tile1.value;
  const nextValue = getNextValue(oldValue);
  
  if (!nextValue) {
    return { grid: [...grid], scoreIncrease: 0 };
  }

  // Calculate score - base of triplet value times 3
  const scoreIncrease = oldValue * 3;
  
  // Remove the merged tiles from the grid
  const filteredGrid = grid.filter(tile => 
    !triplet.some(t => t.id === tile.id)
  );
  
  // Calculate the barycenter (average position) of the three tiles
  // This places the new tile at the geometric center of the triplet
  const centerPosition: HexCoord = {
    q: Math.round((tile1.position.q + tile2.position.q + tile3.position.q) / 3),
    r: Math.round((tile1.position.r + tile2.position.r + tile3.position.r) / 3)
  };
  
  // Create a new tile at the calculated center position
  const newTile: Tile = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    value: nextValue,
    position: centerPosition,
    isMerged: true,
  };
  
  return {
    grid: [...filteredGrid, newTile],
    scoreIncrease,
  };
};

/**
 * Resolves all merges on the grid, including chain reactions
 */
export const resolveAllMerges = (grid: Tile[]): { grid: Tile[], scoreIncrease: number } => {
  let currentGrid = [...grid];
  let totalScore = 0;
  let mergesPerformed = true;
  
  // Keep looking for merges until no more are found (chain reactions)
  while (mergesPerformed) {
    const triplets = findAllTriplets(currentGrid);
    
    if (triplets.length === 0) {
      mergesPerformed = false;
    } else {
      // Perform all merges in parallel (no overlap allowed in a single step)
      let newGrid = [...currentGrid];
      let stepScore = 0;
      
      for (const triplet of triplets) {
        // Check if any tile in this triplet was already merged in this step
        const alreadyMerged = triplet.some(t => 
          !newGrid.some(nt => nt.id === t.id)
        );
        
        if (!alreadyMerged) {
          const { grid: mergedGrid, scoreIncrease } = mergeTriplet(newGrid, triplet);
          newGrid = mergedGrid;
          stepScore += scoreIncrease;
        }
      }
      
      currentGrid = newGrid;
      totalScore += stepScore;
    }
  }
  
  return {
    grid: currentGrid,
    scoreIncrease: totalScore,
  };
};

/**
 * Resets the merged flags on all tiles
 */
export const resetMergeFlags = (grid: Tile[]): Tile[] => {
  return grid.map(tile => ({
    ...tile,
    isMerged: false
  }));
}; 