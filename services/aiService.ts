import { BoardState, Coordinates, Player } from '../types';
import { getValidMoves, makeMove, isGameOver, countScore } from './gameLogic';
import { POSITION_WEIGHTS, BOARD_SIZE } from '../constants';

const MAX_DEPTH = 4;

const evaluateBoard = (board: BoardState, player: Player): number => {
  if (!player) return 0;
  const opponent = player === 'black' ? 'white' : 'black';
  let score = 0;

  const counts = countScore(board);
  const totalDiscs = counts.black + counts.white;

  // 1. Positional Strategy (Static Weights)
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === player) score += POSITION_WEIGHTS[r][c];
      else if (board[r][c] === opponent) score -= POSITION_WEIGHTS[r][c];
    }
  }

  // 2. Mobility (Number of valid moves)
  const myMoves = getValidMoves(board, player).length;
  const opMoves = getValidMoves(board, opponent).length;
  
  // Late game optimization: prioritize disc count over position slightly more as game ends
  if (totalDiscs > 50) {
      score += (player === 'black' ? counts.black - counts.white : counts.white - counts.black) * 10;
  } else {
      score += (myMoves - opMoves) * 5;
  }

  return score;
};

export const getBestMove = async (board: BoardState, player: Player): Promise<Coordinates | null> => {
  const validMoves = getValidMoves(board, player);
  if (validMoves.length === 0) return null;

  let bestMove: Coordinates | null = null;
  let bestValue = -Infinity;
  const alpha = -Infinity;
  const beta = Infinity;

  // Simple heuristic sort to improve pruning could go here
  
  for (const move of validMoves) {
    const newBoard = makeMove(board, player, move.row, move.col);
    const moveValue = minimax(newBoard, MAX_DEPTH - 1, alpha, beta, false, player);
    
    if (moveValue > bestValue) {
      bestValue = moveValue;
      bestMove = move;
    }
  }

  return bestMove || validMoves[0];
};

const minimax = (
  board: BoardState, 
  depth: number, 
  alpha: number, 
  beta: number, 
  isMaximizing: boolean, 
  aiPlayer: Player
): number => {
  const opponent = aiPlayer === 'black' ? 'white' : 'black';
  
  if (depth === 0 || isGameOver(board)) {
    return evaluateBoard(board, aiPlayer);
  }

  const currentPlayer = isMaximizing ? aiPlayer : opponent;
  const validMoves = getValidMoves(board, currentPlayer);

  if (validMoves.length === 0) {
    // If no moves, pass turn (recurse without changing board but decrease depth)
    return minimax(board, depth - 1, alpha, beta, !isMaximizing, aiPlayer);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of validMoves) {
      const newBoard = makeMove(board, aiPlayer, move.row, move.col);
      const evalValue = minimax(newBoard, depth - 1, alpha, beta, false, aiPlayer);
      maxEval = Math.max(maxEval, evalValue);
      alpha = Math.max(alpha, evalValue);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of validMoves) {
      const newBoard = makeMove(board, opponent, move.row, move.col);
      const evalValue = minimax(newBoard, depth - 1, alpha, beta, true, aiPlayer);
      minEval = Math.min(minEval, evalValue);
      beta = Math.min(beta, evalValue);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};
