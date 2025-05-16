import { useState } from 'react';
import HexGrid from './components/HexGrid';
import useGameStore from './stores/gameStore';

function App() {
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
    </div>
  );
}

export default App; 