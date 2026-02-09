import { BOARD_SIZE, DIRECTIONS } from '../constants';
import { BoardState, Coordinates, Player } from '../types';

export const createInitialBoard = (): BoardState => {
  const board: BoardState = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = 'white';
  board[mid][mid] = 'white';
  board[mid - 1][mid] = 'black';
  board[mid][mid - 1] = 'black';
  return board;
};

export const isValidMove = (board: BoardState, player: Player, row: number, col: number): boolean => {
  if (board[row][col] !== null || !player) return false;

  for (const [dx, dy] of DIRECTIONS) {
    let r = row + dx;
    let c = col + dy;
    let foundOpponent = false;

    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      const cell = board[r][c];
      if (cell === null) break;
      if (cell !== player) {
        foundOpponent = true;
      } else {
        if (foundOpponent) return true;
        break;
      }
      r += dx;
      c += dy;
    }
  }
  return false;
};

export const getValidMoves = (board: BoardState, player: Player): Coordinates[] => {
  const moves: Coordinates[] = [];
  if (!player) return moves;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (isValidMove(board, player, r, c)) {
        moves.push({ row: r, col: c });
      }
    }
  }
  return moves;
};

export const makeMove = (board: BoardState, player: Player, row: number, col: number): BoardState => {
  if (!player) return board;
  
  const newBoard = board.map(r => [...r]);
  newBoard[row][col] = player;

  for (const [dx, dy] of DIRECTIONS) {
    let r = row + dx;
    let c = col + dy;
    let potentialFlips: Coordinates[] = [];

    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      const cell = newBoard[r][c];
      if (cell === null) break;
      if (cell !== player) {
        potentialFlips.push({ row: r, col: c });
      } else {
        // Encontramos nuestra propia ficha, volteamos las de los oponentes en medio
        for (const flip of potentialFlips) {
          newBoard[flip.row][flip.col] = player;
        }
        break;
      }
      r += dx;
      c += dy;
    }
  }
  return newBoard;
};

export const countScore = (board: BoardState) => {
  let black = 0;
  let white = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'black') black++;
      else if (board[r][c] === 'white') white++;
    }
  }
  return { black, white };
};

export const isGameOver = (board: BoardState): boolean => {
  const blackMoves = getValidMoves(board, 'black');
  const whiteMoves = getValidMoves(board, 'white');
  return blackMoves.length === 0 && whiteMoves.length === 0;
};