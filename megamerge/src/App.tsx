import { useState } from 'react';
import HexGrid from './components/HexGrid';
import useGameStore from './stores/gameStore';

function App() {
  const [gameMode, setGameMode] = useState<'classic' | 'timeTrials' | 'fastPace'>('classic');
  const { score, bestScore, resetGame } = useGameStore();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <header className="mb-4">
        <h1 className="text-4xl font-bold text-center mb-2">MegaMerge</h1>
        <p className="text-gray-400 text-center">A Hexagonal 2048 Experience</p>
      </header>
      
      <div className="flex justify-center items-center mb-4 gap-8">
        <div className="text-center">
          <div className="text-2xl font-bold">{score}</div>
          <div className="text-sm text-gray-400">SCORE</div>
        </div>
        
        <button 
          onClick={resetGame}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors font-bold text-lg shadow-lg transform hover:scale-105 border-2 border-indigo-400"
        >
          New Game
        </button>
        
        <div className="text-center">
          <div className="text-2xl font-bold">{bestScore}</div>
          <div className="text-sm text-gray-400">BEST</div>
        </div>
      </div>

      <main className="w-full flex-grow flex items-center justify-center">
        <HexGrid />
      </main>
      
      <div className="mt-4 text-sm text-gray-400 text-center max-w-lg mx-auto">
        <p className="mb-1">Use arrow keys, WASD, or swipe to move tiles.</p>
        <p className="mb-1">Match three identical tiles to merge them into the next value.</p>
        <p className="mb-1">Try to reach the 1,062,882 tile!</p>
        <p className="mt-2">Press 'r' to reset the game.</p>
        
        <div className="mt-4 p-3 bg-gray-800 rounded-md max-w-lg mx-auto">
          <h3 className="font-bold mb-2 text-white">Keyboard Controls:</h3>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div>
              <p>Northeast: <span className="text-indigo-300">W / ↑</span></p>
              <p>East: <span className="text-indigo-300">D / →</span></p>
              <p>Southeast: <span className="text-indigo-300">S / ↓</span></p>
            </div>
            <div>
              <p>Southwest: <span className="text-indigo-300">X / C / E</span></p>
              <p>West: <span className="text-indigo-300">A / ←</span></p>
              <p>Northwest: <span className="text-indigo-300">Q</span></p>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-4 text-sm text-gray-500">
        © {new Date().getFullYear()} MegaMerge - Hexagonal 2048 Game
      </footer>
    </div>
  );
}

export default App; 