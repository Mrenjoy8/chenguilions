import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tile as TileType, Direction, HexCoord, TileValue } from '../core/types';
import { hexToPixel, coordsEqual, /* getAllGridCoords */ } from '../core/hexUtils';
import { /* TILE_COLORS, */ HEX_SIZE, HEX_SPACING } from '../core/constants';
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
  
  // Get texture pattern ID based on tile value
  const getTexturePattern = (value: TileValue) => {
    // Group tiles by material type based on value range
    if (value <= 18) {
      return 'pattern-wood'; // Wood texture for low values
    } else if (value <= 162) {
      return 'pattern-stone'; // Stone texture for medium values
    } else if (value <= 1458) {
      return 'pattern-metal'; // Metal texture for higher values
    } else {
      return 'pattern-crystal'; // Crystal texture for highest values
    }
  };
  
  // Get glow color and intensity based on tile value
  const getGlowSettings = (value: TileValue) => {
    // Higher value tiles get stronger glow
    const baseIntensity = Math.min(0.7, Math.log10(value) * 0.15);
    
    // Different value ranges get different color glows
    if (value >= 10000) {
      return { color: '#ffcc00', intensity: baseIntensity + 0.1 };  // Gold glow for high values
    } else if (value >= 1000) {
      return { color: '#ff9933', intensity: baseIntensity };        // Orange glow for medium-high values
    } else if (value >= 100) {
      return { color: '#ff5533', intensity: baseIntensity - 0.1 };  // Red glow for medium values
    } else {
      return { color: '#ffffff', intensity: baseIntensity - 0.2 };  // White subtle glow for low values
    }
  };
  
  // Add animation class for merged tiles
  const borderColor = tile.isMerged ? '#ff0000' : '#0f172a';
  const borderWidth = tile.isMerged ? 3 : 2;
  
  // Shadow filter ID for this specific tile
  const shadowFilterId = `drop-shadow-${tile.id}`;
  const highlightFilterId = `highlight-${tile.id}`;
  const glowFilterId = `glow-${tile.id}`;
  const bevelFilterId = `bevel-${tile.id}`;
  const textureId = `texture-${tile.id}`;
  
  // Get glow settings based on tile value
  const glowSettings = getGlowSettings(tile.value);
  
  // Pattern opacity based on tile value
  const textureOpacity = Math.min(0.3, Math.log10(tile.value) * 0.08);
  
  // Generate particles for merge animation
  const generateParticles = (count: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i * (360 / count) * Math.PI) / 180;
      return {
        id: i,
        angle,
        distance: size * 1.2,
        size: Math.random() * 4 + 2,
      };
    });
  };
  
  // Particles for merge animation
  const mergeParticles = tile.isMerged ? generateParticles(12) : [];
  
  // Determine animation variants based on tile state
  const getAnimationVariant = () => {
    if (tile.isNew) {
      // New tile spawn animation
      return {
        initial: { scale: 0, rotate: -180, opacity: 0 },
        animate: { scale: 1, rotate: 0, opacity: 1 },
        transition: { 
          type: "spring", 
          stiffness: 260, 
          damping: 20, 
          duration: 0.5 
        }
      };
    } else if (tile.isMerged) {
      // Merge animation
      return {
        initial: { scale: 1 },
        animate: { scale: [1, 1.2, 1] },
        transition: { 
          duration: 0.6,
          times: [0, 0.5, 1],
          ease: "easeInOut"
        }
      };
    } else {
      // Standard movement animation
      return {
        initial: { scale: 1 },
        animate: { scale: 1 },
        transition: { 
          type: "spring", 
          stiffness: 400,
          damping: 30,
          mass: 1.5
        }
      };
    }
  };
  
  const animationVariant = getAnimationVariant();
  
  return (
    <motion.g
      initial={{ x, y }}
      animate={{ x, y }}
      transition={{ 
        type: "spring",
        damping: 30,
        stiffness: 200,
        mass: 1,
        velocity: 2
      }}
    >
      {/* Define filters for this tile */}
      <defs>
        {/* Drop shadow filter */}
        <filter id={shadowFilterId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.5" floodColor="#000000" />
        </filter>
        
        {/* Highlight filter for directional lighting */}
        <filter id={highlightFilterId} x="-30%" y="-30%" width="160%" height="160%">
          <feSpecularLighting result="specOut" specularExponent="20" lightingColor="#ffffff">
            <fePointLight x="-50" y="-50" z="200" />
          </feSpecularLighting>
          <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
        </filter>
        
        {/* Glow filter based on tile value */}
        <filter id={glowFilterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feFlood floodColor={glowSettings.color} result="glow" />
          <feComposite in="glow" in2="blur" operator="in" result="softGlow" />
          <feComposite in="SourceGraphic" in2="softGlow" operator="over" />
        </filter>
        
        {/* Bevel filter for 3D edges */}
        <filter id={bevelFilterId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="5" specularConstant="0.75" specularExponent="20" lighting-color="#ffffff" result="specOut">
            <fePointLight x="-5000" y="-10000" z="20000" />
          </feSpecularLighting>
          <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
          <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
        </filter>
        
        {/* Material texture patterns */}
        <pattern id={`${textureId}-wood`} patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="scale(0.15)">
          <rect width="100" height="100" fill={getTileColor(tile.value)} />
          <g fill="rgba(0,0,0,0.1)">
            {Array.from({ length: 10 }).map((_, i) => (
              <rect key={`wood-grain-${i}`} y={i * 10} width="100" height="3" />
            ))}
          </g>
        </pattern>
        
        <pattern id={`${textureId}-stone`} patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="scale(0.2)">
          <rect width="100" height="100" fill={getTileColor(tile.value)} />
          {Array.from({ length: 20 }).map((_, i) => {
            // Use deterministic positioning based on index
            const row = Math.floor(i / 5);
            const col = i % 5;
            const xPos = col * 20 + 10;
            const yPos = row * 20 + 10;
            // Alternate sizes for visual interest
            const radius = ((i % 3) + 1) * 2;
            
            return (
              <circle 
                key={i} 
                cx={xPos} 
                cy={yPos} 
                r={radius} 
                fill="rgba(0,0,0,0.07)" 
              />
            );
          })}
        </pattern>
        
        <pattern id={`${textureId}-metal`} patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="scale(0.1) rotate(45)">
          <rect width="100" height="100" fill={getTileColor(tile.value)} />
          <rect x="0" y="0" width="50" height="50" fill="rgba(255,255,255,0.05)" />
          <rect x="50" y="50" width="50" height="50" fill="rgba(255,255,255,0.05)" />
        </pattern>
        
        <pattern id={`${textureId}-crystal`} patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="scale(0.1)">
          <rect width="100" height="100" fill={getTileColor(tile.value)} />
          <polygon points="0,0 100,0 50,50" fill="rgba(255,255,255,0.1)" />
          <polygon points="0,100 100,100 50,50" fill="rgba(255,255,255,0.1)" />
          <polygon points="0,0 0,100 50,50" fill="rgba(255,255,255,0.08)" />
          <polygon points="100,0 100,100 50,50" fill="rgba(255,255,255,0.08)" />
        </pattern>
      </defs>
      
      {/* Shadow hexagon (positioned slightly below to create floating effect) */}
      <polygon
        points={hexPoints}
        fill="#000000"
        opacity="0.4"
        transform="translate(0, 5)"
      />
      
      {/* Glow effect (only for higher value tiles) */}
      {tile.value >= 54 && (
        <polygon
          points={hexPoints}
          fill={glowSettings.color}
          opacity={glowSettings.intensity}
          filter={`url(#${glowFilterId})`}
        />
      )}
      
      {/* Merge pulse wave effect */}
      {tile.isMerged && (
        <motion.circle
          cx="0"
          cy="0"
          r={size * 0.5}
          fill="none"
          stroke={glowSettings.color}
          strokeWidth="3"
          initial={{ r: 0, opacity: 0.8 }}
          animate={{ r: size * 2, opacity: 0 }}
          transition={{
            duration: 0.7,
            ease: "easeOut"
          }}
        />
      )}
      
      {/* Main tile group with animation effects */}
      <motion.g
        initial={animationVariant.initial}
        animate={animationVariant.animate}
        transition={animationVariant.transition}
      >
        {/* Beveled edge (inner) */}
        <polygon
          points={getHexPoints(size * 0.98)}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          opacity="0.5"
        />
        
        {/* Main tile hexagon with lighting effects */}
        <polygon
          points={hexPoints}
          fill={getTileColor(tile.value)}
          stroke={borderColor}
          strokeWidth={borderWidth}
          filter={`url(#${shadowFilterId})`}
        />
        
        {/* Material texture overlay */}
        <polygon
          points={hexPoints}
          fill={`url(#${textureId}-${getTexturePattern(tile.value).split('-')[1]})`}
          opacity={textureOpacity}
        />
        
        {/* Beveled edge (outer highlight) */}
        <polygon
          points={getHexPoints(size * 0.92)}
          fill="none"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1.5"
          opacity="0.3"
        />
        
        {/* Highlight overlay with reduced opacity */}
        <polygon
          points={hexPoints}
          fill="white"
          opacity="0.1"
          transform="translate(-5, -5) scale(0.9)"
        />
        
        {/* Value text with pulse animation for higher values */}
        <motion.text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={getTextColor(tile.value)}
          fontSize={tile.value > 1000 ? size / 4 : size / 3}
          fontWeight="bold"
          filter={`url(#${shadowFilterId})`}
          animate={{ 
            scale: tile.value >= 486 ? [1, 1.05, 1] : 1,
            opacity: tile.value >= 486 ? [1, 0.8, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          {tile.value}
        </motion.text>
        
        {/* Small indicator showing tile's position in progression */}
        {tile.value >= 54 && (
          <g transform="translate(0, 25)">
            {Array.from({ length: Math.min(5, Math.floor(Math.log10(tile.value))) }).map((_, i) => {
              const position = (i - Math.min(5, Math.floor(Math.log10(tile.value))) / 2 + 0.5) * 6;
              return (
                <circle
                  key={`indicator-${i}`}
                  cx={position}
                  cy="0"
                  r="2"
                  fill={getTextColor(tile.value)}
                  opacity="0.6"
                />
              );
            })}
          </g>
        )}
      </motion.g>
      
      {/* Particle effects for merged tiles */}
      {tile.isMerged && mergeParticles.map(particle => (
        <motion.circle
          key={`particle-${tile.id}-${particle.id}`}
          cx={0}
          cy={0}
          r={particle.size}
          fill={glowSettings.color}
          initial={{ scale: 0, x: 0, y: 0, opacity: 0.8 }}
          animate={{ 
            scale: [0, 1, 0],
            x: Math.cos(particle.angle) * particle.distance,
            y: Math.sin(particle.angle) * particle.distance,
            opacity: [0.8, 0.5, 0]
          }}
          transition={{
            duration: 0.7,
            ease: "easeOut"
          }}
        />
      ))}
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
  
  // Create a unique ID for this empty cell's gradient
  const gradientId = `cell-gradient-${position.q}-${position.r}`;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#221b4f" />
          <stop offset="100%" stopColor="#141235" />
        </linearGradient>
        <filter id={`cell-inner-shadow-${position.q}-${position.r}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
          <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
        </filter>
      </defs>
      
      {/* Inset shadow effect to make empty cells look recessed */}
      <polygon
        points={hexPoints}
        fill={`url(#${gradientId})`}
        stroke="#0a0823"
        strokeWidth="1.5"
        opacity="0.9"
        filter={`url(#cell-inner-shadow-${position.q}-${position.r})`}
      />
      
      {/* Inner highlight creating a subtle rim light */}
      <polygon
        points={getHexPoints(size * 0.85)}
        fill="none"
        stroke="#5d4fa2"
        strokeWidth="0.5"
        opacity="0.15"
      />
      
      {/* Center dot */}
      <circle
        cx="0"
        cy="0"
        r="1.5"
        fill="#5d4fa2"
        opacity="0.2"
      />
    </g>
  );
};

// Score Popup Component - Displays animated score when tiles merge
const ScorePopup: React.FC<{
  value: number; 
  position: {x: number, y: number};
  onComplete: () => void;
}> = ({ value, position, onComplete }) => {
  return (
    <motion.text
      x={position.x}
      y={position.y}
      textAnchor="middle"
      fontWeight="bold"
      fontSize={HEX_SIZE / 2.5}
      fill="#ffffff"
      stroke="#000000"
      strokeWidth="0.5"
      initial={{ y: position.y, opacity: 0, scale: 0.5 }}
      animate={{ 
        y: position.y - 40, 
        opacity: [0, 1, 0], 
        scale: [0.5, 1.2, 1] 
      }}
      transition={{ 
        duration: 1.2,
        times: [0, 0.3, 1],
        ease: "easeOut"
      }}
      onAnimationComplete={onComplete}
    >
      +{value}
    </motion.text>
  );
};

// Board Reaction Component - Provides full-board visual feedback
const BoardReaction: React.FC<{
  intensity: 'low' | 'medium' | 'high';
  onComplete: () => void;
}> = ({ intensity, onComplete }) => {
  // Configure effects based on intensity
  const getIntensityConfig = () => {
    switch (intensity) {
      case 'high':
        return {
          color: '#ff9500',
          opacity: 0.4,
          duration: 1.2,
          pulseCount: 3
        };
      case 'medium':
        return {
          color: '#ffcc00',
          opacity: 0.25,
          duration: 0.9,
          pulseCount: 2
        };
      case 'low':
      default:
        return {
          color: '#ffffff',
          opacity: 0.15,
          duration: 0.7,
          pulseCount: 1
        };
    }
  };

  const config = getIntensityConfig();
  const svgSize = 2000; // Large enough to cover the entire board

  return (
    <motion.rect
      x={-svgSize / 2}
      y={-svgSize / 2}
      width={svgSize}
      height={svgSize}
      fill={config.color}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: Array(config.pulseCount).fill(0).flatMap(() => [0, config.opacity, 0])
      }}
      transition={{ 
        duration: config.duration,
        ease: "easeInOut",
        times: Array(config.pulseCount).fill(0).flatMap((_, i, arr) => {
          const step = 1 / arr.length / 3;
          return [i/arr.length, i/arr.length + step, (i+1)/arr.length];
        })
      }}
      onAnimationComplete={onComplete}
    />
  );
};

// Combo Indicator Component - Shows visual feedback for sequential merges
const ComboIndicator: React.FC<{
  comboCount: number;
  position: {x: number, y: number};
  onComplete: () => void;
}> = ({ comboCount, position, onComplete }) => {
  if (comboCount <= 1) return null;
  
  const getComboColor = () => {
    if (comboCount >= 5) return '#ff2d55'; // Red for high combos
    if (comboCount >= 3) return '#ff9500'; // Orange for medium combos
    return '#ffcc00'; // Yellow for low combos
  };
  
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1.1, 0.9],
        y: [0, -20, -25, -35]
      }}
      transition={{ 
        duration: 1.5,
        times: [0, 0.2, 0.6, 1],
        ease: "easeOut"
      }}
      onAnimationComplete={onComplete}
    >
      <motion.rect
        x={position.x - 40}
        y={position.y - 20}
        width={80}
        height={40}
        rx={10}
        fill={getComboColor()}
        filter="drop-shadow(0 2px 5px rgba(0,0,0,0.5))"
      />
      <motion.text
        x={position.x}
        y={position.y + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={HEX_SIZE / 2.5}
        fontWeight="bold"
        fill="#ffffff"
      >
        {comboCount}x
      </motion.text>
    </motion.g>
  );
};

const HexGrid: React.FC = () => {
  const { grid, validCoords, moveInDirection, resetGame, lastMergeTriplet } = useGameStore();
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [, setViewportSize] = useState({ width: 0, height: 0 });
  
  // Visual feedback states
  const [scorePopups, setScorePopups] = useState<{id: string; value: number; position: {x: number, y: number}}[]>([]);
  const [boardReactions, setBoardReactions] = useState<{id: string; intensity: 'low' | 'medium' | 'high'}[]>([]);
  const [comboIndicator, setComboIndicator] = useState<{comboCount: number; position: {x: number, y: number}} | null>(null);
  
  // Combo tracking
  const comboCountRef = useRef<number>(0);
  const lastScoreRef = useRef<number>(0);
  const prevGridRef = useRef<TileType[]>([]);
  
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
  
  // Track score changes and merged tiles for visual feedback
  useEffect(() => {
    // Skip on first render
    if (prevGridRef.current.length === 0) {
      prevGridRef.current = grid;
      return;
    }
    
    // Find newly merged tiles
    const newMergedTiles = grid.filter(tile => tile.isMerged);
    
    if (newMergedTiles.length > 0) {
      // Calculate score change based on merged tiles
      // For this example, we'll use a simple formula based on the merged tile value
      const prevScore = lastScoreRef.current;
      const currentScore = useGameStore.getState().score;
      const scoreChange = currentScore - prevScore;
      
      // Update last score
      lastScoreRef.current = currentScore;
      
      // Increment combo counter
      comboCountRef.current += 1;
      
      // Create score popups
      newMergedTiles.forEach(tile => {
        const popupValue = Math.floor(scoreChange / newMergedTiles.length);
        const position = hexToPixel(tile.position, HEX_SIZE + HEX_SPACING);
        const id = `score-popup-${Date.now()}-${Math.random()}`;
        
        setScorePopups(prev => [...prev, { id, value: popupValue, position }]);
      });
      
      // Generate board reaction based on tile value
      const highestMergedValue = Math.max(...newMergedTiles.map(t => t.value));
      let reactionIntensity: 'low' | 'medium' | 'high' = 'low';
      
      if (highestMergedValue >= 1458) {
        reactionIntensity = 'high';
      } else if (highestMergedValue >= 162) {
        reactionIntensity = 'medium';
      }
      
      const reactionId = `board-reaction-${Date.now()}`;
      setBoardReactions(prev => [...prev, { id: reactionId, intensity: reactionIntensity }]);
      
      // Show combo indicator if more than one combo
      if (comboCountRef.current > 1) {
        // Calculate position for combo indicator (center of the board)
        setComboIndicator({
          comboCount: comboCountRef.current,
          position: { x: 0, y: 0 }
        });
      }
    } else {
      // Reset combo count if no merges happened
      comboCountRef.current = 0;
    }
    
    // Update previous grid
    prevGridRef.current = grid;
  }, [grid]);
  
  // Reset combo and feedback states on game reset
  useEffect(() => {
    if (grid.length <= 5) { // Assuming a new game has 5 starter tiles
      comboCountRef.current = 0;
      lastScoreRef.current = 0;
      setScorePopups([]);
      setBoardReactions([]);
      setComboIndicator(null);
    }
  }, [grid]);
  
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
  
  // Render connection lines between merging tiles
  const renderMergeConnections = () => {
    if (!lastMergeTriplet || lastMergeTriplet.length !== 3) return null;
    
    // Find the positions of the merged tiles
    const positions = lastMergeTriplet.map(tileId => {
      const tile = grid.find(t => t.id === tileId);
      return tile ? hexToPixel(tile.position, HEX_SIZE + HEX_SPACING) : null;
    }).filter(Boolean) as { x: number, y: number }[];
    
    if (positions.length !== 3) return null;
    
    // Create a unique ID for the merge connection
    const connectionId = `connection-${lastMergeTriplet.join('-')}`;
    
    return (
      <g>
        <defs>
          <filter id={`glow-${connectionId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#FF9500" result="glow" />
            <feComposite in="glow" in2="blur" operator="in" result="softGlow" />
            <feComposite in="SourceGraphic" in2="softGlow" operator="over" />
          </filter>
        </defs>
        
        {/* Connection lines with animation */}
        {positions.map((pos1, i) => {
          const pos2 = positions[(i + 1) % positions.length];
          return (
            <motion.line
              key={`connection-${i}-${(i + 1) % positions.length}`}
              x1={pos1.x}
              y1={pos1.y}
              x2={pos2.x}
              y2={pos2.y}
              stroke="#FF9500"
              strokeWidth="3"
              strokeLinecap="round"
              filter={`url(#glow-${connectionId})`}
              initial={{ pathLength: 0, opacity: 0.8 }}
              animate={{ pathLength: 1, opacity: [0.8, 1, 0] }}
              transition={{ 
                pathLength: { duration: 0.3, ease: "easeOut" },
                opacity: { duration: 0.6, times: [0, 0.7, 1], delay: 0.3 }
              }}
            />
          );
        })}
        
        {/* Central energy burst */}
        <motion.circle
          cx={(positions[0].x + positions[1].x + positions[2].x) / 3}
          cy={(positions[0].y + positions[1].y + positions[2].y) / 3}
          r={HEX_SIZE / 3}
          fill="#FF9500"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 0.8, 0] }}
          transition={{ 
            duration: 0.8, 
            times: [0, 0.3, 1],
            delay: 0.3,
            ease: "easeOut" 
          }}
          filter={`url(#glow-${connectionId})`}
        />
        
        {/* Additional pulse rings */}
        <motion.circle
          cx={(positions[0].x + positions[1].x + positions[2].x) / 3}
          cy={(positions[0].y + positions[1].y + positions[2].y) / 3}
          r={HEX_SIZE / 2}
          fill="none"
          stroke="#FF9500"
          strokeWidth="2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 2], opacity: [0, 0.5, 0] }}
          transition={{ 
            duration: 1, 
            times: [0, 0.4, 1],
            delay: 0.4
          }}
          filter={`url(#glow-${connectionId})`}
        />
      </g>
    );
  };
  
  // Remove score popup handler
  const handleScorePopupComplete = (id: string) => {
    setScorePopups(popups => popups.filter(popup => popup.id !== id));
  };
  
  // Remove board reaction handler
  const handleBoardReactionComplete = (id: string) => {
    setBoardReactions(reactions => reactions.filter(reaction => reaction.id !== id));
  };
  
  // Reset combo indicator
  const handleComboComplete = () => {
    setComboIndicator(null);
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div
        ref={containerRef}
        className="relative touch-none w-full max-w-5xl aspect-square flex items-center justify-center p-4 rounded-xl"
        style={{ 
          height: 'min(85vh, 85vw)',
          margin: '2rem auto',
          background: 'radial-gradient(circle at center, #ffffff 0%, #0f0a2a 100%)',
          boxShadow: 'inset 0 0 80px rgba(30, 20, 60, 0.6), 0 10px 30px rgba(0, 0, 0, 0.4)',
          border: '2px solid rgba(93, 79, 162, 0.3)'
        }}
      >
        {/* Background pattern for the board */}
        <div className="absolute inset-0 z-0 rounded-xl overflow-hidden">
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          ></div>
        </div>

        <svg
          ref={svgRef}
          viewBox={svgViewBox}
          className="w-full h-full relative z-10"
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
          
          {/* Merge connection effect */}
          {renderMergeConnections()}
          
          {/* Board reactions */}
          <AnimatePresence>
            {boardReactions.map(reaction => (
              <BoardReaction
                key={reaction.id}
                intensity={reaction.intensity}
                onComplete={() => handleBoardReactionComplete(reaction.id)}
              />
            ))}
          </AnimatePresence>
          
          {/* Tiles */}
          {grid.map((tile: TileType) => (
            <HexTile key={tile.id} tile={tile} size={HEX_SIZE} />
          ))}
          
          {/* Score popups */}
          <AnimatePresence>
            {scorePopups.map(popup => (
              <ScorePopup
                key={popup.id}
                value={popup.value}
                position={popup.position}
                onComplete={() => handleScorePopupComplete(popup.id)}
              />
            ))}
          </AnimatePresence>
          
          {/* Combo indicator */}
          <AnimatePresence>
            {comboIndicator && (
              <ComboIndicator
                comboCount={comboIndicator.comboCount}
                position={comboIndicator.position}
                onComplete={handleComboComplete}
              />
            )}
          </AnimatePresence>
        </svg>
      </div>
    </div>
  );
};

export default HexGrid; 