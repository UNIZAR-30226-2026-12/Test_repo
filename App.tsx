import React, { useState, useEffect } from 'react';
import { GameState } from './types';
import * as api from './services/api';
import Board from './components/Board';
import ScoreBoard from './components/ScoreBoard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.createGame();
      setGameId(data.game_id);
      setGameState({
        board: data.board,
        currentPlayer: data.current_player,
        gameOver: data.game_over,
        winner: data.winner,
        score: data.score,
        validMoves: data.valid_moves,
        lastMove: data.last_move || null
      });
    } catch (err) {
      setError("Error de conexión: Asegúrate de que 'python backend.py' esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  const onCellClick = async (row: number, col: number) => {
    if (!gameId || !gameState || gameState.currentPlayer !== 'black' || loading) return;

    setLoading(true);
    try {
      const data = await api.makeMove(gameId, row, col, 'black');
      setGameState({
        board: data.board,
        currentPlayer: data.current_player,
        gameOver: data.game_over,
        winner: data.winner,
        score: data.score,
        validMoves: data.valid_moves,
        lastMove: data.last_move || null
      });
    } catch (err: any) {
      console.error(err);
      setError("Se perdió la conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-950 p-6">
        <div className="max-w-md w-full bg-stone-900 border border-red-500/20 p-10 rounded-3xl text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Sin Conexión</h2>
          <p className="text-stone-400 mb-8 text-sm leading-relaxed">{error}</p>
          <button 
            onClick={initGame} 
            className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase text-xs tracking-[0.2em] hover:bg-stone-200 transition-all active:scale-95"
          >
            Reintentar Conexión
          </button>
        </div>
      </div>
    );
  }

  if (loading && !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-stone-800 border-t-green-500 rounded-full animate-spin"></div>
          <p className="text-stone-500 text-[10px] uppercase font-bold tracking-[0.5em]">Sincronizando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 text-stone-100 p-4 select-none">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">
          REVERSI<span className="text-green-500 not-italic">.</span>AI
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2 opacity-50">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <p className="text-[9px] uppercase tracking-[0.3em] font-bold">FastAPI Backend Online</p>
        </div>
      </header>

      {gameState && (
        <div className="flex flex-col lg:flex-row items-center gap-16 max-w-6xl w-full justify-center">
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
      )}
    </div>
  );
};

export default App;
