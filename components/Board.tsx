import React from 'react';
import { BoardState, Coordinates } from '../types';
import Disc from './Disc';

interface BoardProps {
  board: BoardState;
  validMoves: Coordinates[];
  lastMove: Coordinates | null;
  onCellClick: (row: number, col: number) => void;
  disabled: boolean;
}

const Board: React.FC<BoardProps> = ({ board, validMoves, lastMove, onCellClick, disabled }) => {
  
  const isValid = (r: number, c: number) => {
    return validMoves.some(m => m.row === r && m.col === c);
  };

  const isRecent = (r: number, c: number) => {
    return lastMove?.row === r && lastMove?.col === c;
  };

  return (
    <div className="relative p-3 bg-stone-800 rounded-lg shadow-2xl shadow-black">
      {/* Borde del Tablero */}
      <div className="grid grid-cols-8 gap-1 bg-green-900 p-1 border-4 border-stone-700 rounded shadow-inner">
        {board.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((cell, colIndex) => {
              const valid = isValid(rowIndex, colIndex);
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => !disabled && valid ? onCellClick(rowIndex, colIndex) : undefined}
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16
                    bg-green-700 relative flex items-center justify-center
                    ${valid && !disabled ? 'cursor-pointer hover:bg-green-600' : ''}
                  `}
                >
                  {/* Marcadores de posición de la cuadrícula (estilo opcional) */}
                  {/* Indicador de movimiento válido */}
                  {valid && !disabled && (
                    <div className="absolute w-3 h-3 bg-green-900/40 rounded-full animate-pulse border border-green-800/50"></div>
                  )}

                  {/* Ficha */}
                  <Disc player={cell} isRecent={isRecent(rowIndex, colIndex)} />
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      
      {/* Etiquetas de coordenadas - Estilo visual opcional */}
      <div className="absolute -left-6 top-5 flex flex-col justify-between h-[90%] text-stone-500 text-xs font-mono hidden md:flex">
        {[1,2,3,4,5,6,7,8].map(n => <span key={n}>{n}</span>)}
      </div>
      <div className="absolute -bottom-6 left-5 flex justify-between w-[90%] text-stone-500 text-xs font-mono hidden md:flex">
        {['A','B','C','D','E','F','G','H'].map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
};

export default Board;