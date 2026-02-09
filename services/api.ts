import { GameState, Player, BoardState } from '../types';
import * as gameLogic from './gameLogic';
import * as aiService from './aiService';

const API_URL = 'http://localhost:8000';

export interface BackendGameState {
  game_id: string;
  board: BoardState;
  current_player: Player;
  winner: Player | 'draw' | null;
  game_over: boolean;
  score: {
    black: number;
    white: number;
  };
  is_offline_mode?: boolean; 
}

// --- Local Fallback Logic ---
let localGame: BackendGameState | null = null;

const calculateWinner = (score: {black: number, white: number}): Player | 'draw' | null => {
    if (score.black > score.white) return 'black';
    if (score.white > score.black) return 'white';
    return 'draw';
};

const updateLocalGameState = (board: BoardState, currentPlayer: Player): Partial<BackendGameState> => {
    // Check valid moves for current player
    const moves = gameLogic.getValidMoves(board, currentPlayer);
    let nextPlayer = currentPlayer;
    let gameOver = false;
    let winner: Player | 'draw' | null = null;

    if (moves.length === 0) {
        // Current player has no moves, check opponent
        const opponent: Player = currentPlayer === 'black' ? 'white' : 'black';
        const opponentMoves = gameLogic.getValidMoves(board, opponent);
        
        if (opponentMoves.length === 0) {
            // Both have no moves -> Game Over
            gameOver = true;
        } else {
            // Pass turn
            nextPlayer = opponent;
        }
    }

    const score = gameLogic.countScore(board);
    if (gameOver) {
        winner = calculateWinner(score);
        nextPlayer = null;
    }

    return {
        board,
        current_player: nextPlayer,
        game_over: gameOver,
        winner,
        score
    };
};

const createLocalGame = (): BackendGameState => {
    const board = gameLogic.createInitialBoard();
    localGame = {
        game_id: 'local-' + Date.now(),
        board,
        current_player: 'black',
        winner: null,
        game_over: false,
        score: { black: 2, white: 2 },
        is_offline_mode: true
    };
    return localGame;
};

const makeLocalMove = async (gameId: string, row: number, col: number, player: Player): Promise<BackendGameState> => {
    if (!localGame) throw new Error("No local game found");
    
    // 1. Human Move
    let newBoard = gameLogic.makeMove(localGame.board, player, row, col);
    const nextPlayer: Player = player === 'black' ? 'white' : 'black';
    
    let updates = updateLocalGameState(newBoard, nextPlayer);
    
    // 2. AI Move (if it's AI turn now and game not over)
    if (!updates.game_over && updates.current_player === 'white') {
        // Artificial delay for realism
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const aiMove = await aiService.getBestMove(updates.board!, 'white');
        if (aiMove) {
            newBoard = gameLogic.makeMove(updates.board!, 'white', aiMove.row, aiMove.col);
            // After AI moves, check next state for Black
            updates = updateLocalGameState(newBoard, 'black');
        } else {
             // AI has no moves (Pass) - updateLocalGameState handles "no moves" check, 
             // but if we are here, updateLocalGameState already said it was White's turn.
             // If White has no moves, updateLocalGameState would have set current_player to Black (Pass)
             // inside the *previous* call? 
             // Actually, let's just re-evaluate logic. 
             // If updateLocalGameState says it's White's turn, it means White HAS moves.
             // So getBestMove should return something.
             // Safe fallback:
             updates = updateLocalGameState(newBoard, 'black');
        }
    }

    localGame = {
        ...localGame,
        ...updates
    } as BackendGameState;
    
    return localGame;
};


// --- Public API ---

export const createGame = async (): Promise<BackendGameState> => {
  try {
    const response = await fetch(`${API_URL}/partida`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start game');
    return await response.json();
  } catch (error) {
    console.warn("Backend unavailable. Starting Offline Mode.", error);
    return createLocalGame();
  }
};

export const makeMove = async (gameId: string, row: number, col: number, player: Player): Promise<BackendGameState> => {
  // If gameId indicates local game, bypass network
  if (gameId.startsWith('local-')) {
      return makeLocalMove(gameId, row, col, player);
  }

  try {
    const response = await fetch(`${API_URL}/movimiento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_id: gameId,
        row,
        col,
        player,
      }),
    });
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to make move');
    }
    return await response.json();
  } catch (error) {
    console.error("API connection lost during move. Attempting to switch to local? (Not implemented for ongoing server games)");
    throw error;
  }
};