export type Player = 'black' | 'white' | null;
export type BoardState = Player[][];

export interface Coordinates {
  row: number;
  col: number;
}

export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  gameOver: boolean;
  winner: Player | 'draw' | null;
  score: {
    black: number;
    white: number;
  };
  validMoves: Coordinates[];
  lastMove: Coordinates | null;
}