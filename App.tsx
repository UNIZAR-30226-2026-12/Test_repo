import React, { useState, useEffect } from 'react';
import { GameState, Coordinates } from './types';
import { getValidMoves } from './services/gameLogic';
import * as api from './services/api';
import Board from './components/Board';
import ScoreBoard from './components/ScoreBoard';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: [], // Será llenado por backend/api
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
    // Calcular movimientos válidos localmente solo para resaltado en UI
    // El backend (o backend simulado) valida la lógica del movimiento
    const validMoves = getValidMoves(backendState.board, backendState.current_player);
    
    setGameState({
      board: backendState.board,
      currentPlayer: backendState.current_player,
      gameOver: backendState.game_over,
      winner: backendState.winner,
      score: backendState.score,
      validMoves: validMoves,
      lastMove: gameState.lastMove // Nota: El backend no devuelve la coordenada del último movimiento explícitamente
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
      console.error("Falló la inicialización del juego incluso con respaldo", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  const onCellClick = async (row: number, col: number) => {
    if (!gameId || gameState.currentPlayer !== 'black' || gameState.gameOver || loading) return;

    // Prevención de interacción UI optimista
    setLoading(true);
    
    try {
      const newData = await api.makeMove(gameId, row, col, 'black');
      
      // Si el backend manejó el turno de la IA inmediatamente, el estado devuelto tiene el movimiento de la IA aplicado
      syncGameState(newData);
      
      // Actualizar último movimiento para énfasis visual
      setGameState(prev => ({ ...prev, lastMove: { row, col } }));

    } catch (err: any) {
      alert(err.message || "Error al realizar movimiento");
      setLoading(false);
    }
  };

  if (loading && !gameState.board.length) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-stone-900 text-white">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full mb-4"></div>
                <p>Conectando...</p>
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
            ? <span className="text-amber-400 font-mono">MODO OFFLINE (Backend No Disponible)</span> 
            : <span className="text-green-400 font-mono">ONLINE (Backend Python Conectado)</span>
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
        <p>Para ejecutar Backend Python:</p>
        <code className="bg-stone-800 px-1 rounded">uvicorn backend:app --reload</code>
      </div>
    </div>
  );
};

export default App;