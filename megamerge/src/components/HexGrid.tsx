import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tile as TileType, Direction, HexCoord, TileValue } from '../core/types';
import { hexToPixel, coordsEqual, getAllGridCoords } from '../core/hexUtils';
import { TILE_COLORS, HEX_SIZE, HEX_SPACING } from '../core/constants';
import useGameStore from '../stores/gameStore';
import useSwipeDetection from '../hooks/useSwipeDetection';

// SVG polygon points for a hexagon
const getHexPoints = (size: number): string => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180;
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
};

// Single Hex Tile component
const HexTile: React.FC<{
  tile: TileType;
  size: number;
}> = ({ tile, size }) => {
  const { x, y } = hexToPixel(tile.position, size + HEX_SPACING);
  const hexPoints = getHexPoints(size);
  
  // Use hardcoded colors instead of CSS variables for better compatibility
  const getTileColor = (value: TileValue): string => {
    const colors: Record<TileValue, string> = {
      2: '#eee4da',
      6: '#ede0c8',
      18: '#f2b179',
      54: '#f59563',
      162: '#f67c5f',
      486: '#f65e3b',
      1458: '#edcf72',
      4374: '#edcc61',
      13122: '#edc850',
      39366: '#edc53f',
      118098: '#edc22e',
      354294: '#3c3a32',
      1062882: '#1c1b17'
    };
    return colors[value] || '#eeeeee';
  };
  
  const getTextColor = (value: TileValue): string => {
    return [2, 6, 18, 54, 1458, 4374, 13122, 39366, 118098].includes(value) 
      ? '#776e65' // dark text
      : '#f9f6f2'; // light text
  };
  
  // Add animation class for merged tiles
  const borderColor = tile.isMerged ? '#ff0000' : '#0f172a';
  const borderWidth = tile.isMerged ? 3 : 2;
  
  return (
    <motion.g
      initial={{ scale: tile.isNew ? 0 : 1, x, y }}
      animate={{ scale: 1, x, y }}
      transition={{ 
        duration: 0.5, // Slower animation for movement
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
    >
      <motion.polygon
        points={hexPoints}
        fill={getTileColor(tile.value)}
        stroke={borderColor}
        strokeWidth={borderWidth}
        animate={{ 
          scale: tile.isMerged ? [1, 1.1, 1] : 1,
        }}
        transition={{ 
          duration: 0.8,
          repeat: tile.isMerged ? 1 : 0
        }}
      />
      <text
        x="0"
        y="0"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={getTextColor(tile.value)}
        fontSize={tile.value > 1000 ? size / 4 : size / 3}
        fontWeight="bold"
      >
        {tile.value}
      </text>
    </motion.g>
  );
};

// Empty cell component
const EmptyCell: React.FC<{
  position: HexCoord;
  size: number;
}> = ({ position, size }) => {
  const { x, y } = hexToPixel(position, size + HEX_SPACING);
  const hexPoints = getHexPoints(size);
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <polygon
        points={hexPoints}
        fill="#272639"
        stroke="#0f172a"
        strokeWidth="1"
        opacity="0.5"
      />
    </g>
  );
};

const HexGrid: React.FC = () => {
  const { grid, validCoords, moveInDirection, resetGame } = useGameStore();
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  
  // Calculate grid sizing
  const scaleFactor = 1.0; // Reduced to make hexagons appear larger relative to viewBox
  const baseHexSize = 50; // Fixed base size for consistent viewBox calculation
  const gridWidth = baseHexSize * 16 * scaleFactor;
  const gridHeight = baseHexSize * 16 * scaleFactor;
  const svgViewBox = `-${gridWidth / 2} -${gridHeight / 2} ${gridWidth} ${gridHeight}`;
  
  // Handle viewport resizing
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Set initial size
    handleResize();
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle swipe detection
  const { containerRef } = useSwipeDetection({
    onSwipe: (direction: Direction) => {
      moveInDirection(direction);
    },
  });

  // Reset game on mount to ensure initial tiles are created
  useEffect(() => {
    if (!isInitialized) {
      resetGame();
      setIsInitialized(true);
    }
  }, [resetGame, isInitialized]);
  
  // Set up keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'e':
          moveInDirection(Direction.NORTHEAST);
          break;
        case 'd':
          moveInDirection(Direction.EAST);
          break;
        case 'c':
          moveInDirection(Direction.SOUTHEAST);
          break;
        case 'x':
          moveInDirection(Direction.SOUTHWEST);
          break;
        case 's':
          moveInDirection(Direction.WEST);
          break;
        case 'w':
          moveInDirection(Direction.NORTHWEST);
          break;
        case 'r':
          resetGame();
          break;
        default:
          return;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveInDirection, resetGame]);
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div
        ref={containerRef}
        className="relative touch-none w-full max-w-5xl aspect-square flex items-center justify-center p-4"
        style={{ 
          height: 'min(85vh, 85vw)',
          margin: '2rem auto'
        }}
      >
        <svg
          ref={svgRef}
          viewBox={svgViewBox}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Empty cells */}
          {validCoords.map((coord: HexCoord) => {
            const hasTile = grid.some((tile: TileType) => coordsEqual(tile.position, coord));
            if (!hasTile) {
              return <EmptyCell key={`empty-${coord.q}-${coord.r}`} position={coord} size={HEX_SIZE} />;
            }
            return null;
          })}
          
          {/* Tiles */}
          {grid.map((tile: TileType) => (
            <HexTile key={tile.id} tile={tile} size={HEX_SIZE} />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default HexGrid; 