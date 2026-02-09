import React from 'react';
import { Player } from '../types';

interface ScoreBoardProps {
  score: { black: number; white: number };
  currentPlayer: Player;
  gameOver: boolean;
  winner: Player | 'draw' | null;
  onReset: () => void;
  aiThinking: boolean;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, currentPlayer, gameOver, winner, onReset, aiThinking }) => {
  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
        {/* Tarjetas de Puntuación */}
      <div className="flex justify-between gap-4">
        <div className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${currentPlayer === 'black' && !gameOver ? 'bg-stone-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-stone-800/50 border-stone-700'}`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-600 shadow-md"></div>
                <span className="font-bold text-lg">Negras</span>
            </div>
            <span className="text-3xl font-mono font-bold">{score.black}</span>
        </div>

        <div className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${currentPlayer === 'white' && !gameOver ? 'bg-stone-800 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-stone-800/50 border-stone-700'}`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 shadow-md"></div>
                <span className="font-bold text-lg">Blancas</span>
            </div>
            <span className="text-3xl font-mono font-bold">{score.white}</span>
        </div>
      </div>

      {/* Área de Estado */}
      <div className="bg-stone-900/80 p-6 rounded-xl border border-stone-700 text-center min-h-[120px] flex flex-col items-center justify-center relative overflow-hidden">
        {gameOver ? (
            <div className="animate-in zoom-in duration-300">
                <h2 className="text-2xl font-bold mb-2">Juego Terminado</h2>
                <p className="text-xl text-green-400">
                    {winner === 'draw' ? "¡Empate!" : `¡Ganan ${winner === 'black' ? 'Negras' : 'Blancas'}!`}
                </p>
                <button 
                    onClick={onReset}
                    className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-full transition-colors"
                >
                    Jugar de Nuevo
                </button>
            </div>
        ) : (
            <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <span className="text-stone-400">Turno Actual:</span>
                    <span className={`font-bold ${currentPlayer === 'black' ? 'text-stone-300' : 'text-white'}`}>
                        {currentPlayer === 'black' ? 'Negras (Jugador)' : 'Blancas (IA)'}
                    </span>
                </div>
                {aiThinking && (
                     <div className="flex items-center justify-center gap-2 text-sm text-green-400 animate-pulse">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Pensando...
                    </div>
                )}
                {!aiThinking && currentPlayer === 'black' && (
                    <p className="text-stone-500 text-sm">Selecciona una celda resaltada para mover</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ScoreBoard;