import React, { useState, useEffect } from 'react';
import { GameState, Coordinates } from './types';
import { getValidMoves } from './services/gameLogic';
import * as api from './services/api';
import Board from './components/Board';
import ScoreBoard from './components/ScoreBoard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: [], // Will be filled by backend/api
    currentPlayer: 'black',
    gameOver: false,
    winner: null,
    score: { black: 2, white: 2 },
    validMoves: [],
    lastMove: null
  });

  const [gameId, setGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const syncGameState = (backendState: api.BackendGameState) => {
    // Calculate valid moves locally for UI highlighting only
    // The backend (or mock backend) validates the move logic
    const validMoves = getValidMoves(backendState.board, backendState.current_player);
    
    setGameState({
      board: backendState.board,
      currentPlayer: backendState.current_player,
      gameOver: backendState.game_over,
      winner: backendState.winner,
      score: backendState.score,
      validMoves: validMoves,
      lastMove: gameState.lastMove // Note: Backend doesn't return last move coord explicitly
    });
    if (backendState.is_offline_mode) {
        setIsOffline(true);
    }
    setLoading(false);
  };

  const initGame = async () => {
    setLoading(true);
    try {
      const data = await api.createGame();
      setGameId(data.game_id);
      syncGameState(data);
    } catch (err) {
      console.error("Failed to init game even with fallback", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  const onCellClick = async (row: number, col: number) => {
    if (!gameId || gameState.currentPlayer !== 'black' || gameState.gameOver || loading) return;

    // Optimistic UI interaction prevention
    setLoading(true);
    
    try {
      const newData = await api.makeMove(gameId, row, col, 'black');
      
      // If the backend handled the AI turn immediately, the returned state has the AI move applied
      syncGameState(newData);
      
      // Update last move for visual emphasis 
      setGameState(prev => ({ ...prev, lastMove: { row, col } }));

    } catch (err: any) {
      alert(err.message || "Error making move");
      setLoading(false);
    }
  };

  if (loading && !gameState.board.length) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-stone-900 text-white">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full mb-4"></div>
                <p>Connecting...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 text-stone-100 p-4">
      <div className="mb-8 text-center relative">
        <h1 className="text-4xl md:text-5xl font-bold text-green-500 mb-2 tracking-tight">Reversi</h1>
        <p className="text-stone-400 text-sm max-w-md mx-auto">
          {isOffline 
            ? <span className="text-amber-400 font-mono">OFFLINE MODE (Backend Unreachable)</span> 
            : <span className="text-green-400 font-mono">ONLINE (Python Backend Connected)</span>
          }
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
        <Board 
          board={gameState.board} 
          validMoves={gameState.validMoves}
          lastMove={gameState.lastMove}
          onCellClick={onCellClick}
          disabled={gameState.currentPlayer !== 'black' || gameState.gameOver || loading}
        />
        
        <ScoreBoard 
          score={gameState.score}
          currentPlayer={gameState.currentPlayer}
          gameOver={gameState.gameOver}
          winner={gameState.winner}
          onReset={initGame}
          aiThinking={loading && gameState.currentPlayer === 'white'}
        />
      </div>
      
      <div className="fixed bottom-4 right-4 text-xs text-stone-600 max-w-xs text-right hidden md:block">
        <p>To run Python Backend:</p>
        <code className="bg-stone-800 px-1 rounded">uvicorn backend:app --reload</code>
      </div>
    </div>
  );
};

export default App;
