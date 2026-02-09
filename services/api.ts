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

// --- Lógica de Respaldo Local (Offline) ---
let localGame: BackendGameState | null = null;

const calculateWinner = (score: {black: number, white: number}): Player | 'draw' | null => {
    if (score.black > score.white) return 'black';
    if (score.white > score.black) return 'white';
    return 'draw';
};

const updateLocalGameState = (board: BoardState, currentPlayer: Player): Partial<BackendGameState> => {
    // Verificar movimientos válidos para el jugador actual
    const moves = gameLogic.getValidMoves(board, currentPlayer);
    let nextPlayer = currentPlayer;
    let gameOver = false;
    let winner: Player | 'draw' | null = null;

    if (moves.length === 0) {
        // El jugador actual no tiene movimientos, verificar oponente
        const opponent: Player = currentPlayer === 'black' ? 'white' : 'black';
        const opponentMoves = gameLogic.getValidMoves(board, opponent);
        
        if (opponentMoves.length === 0) {
            // Ambos sin movimientos -> Fin del Juego
            gameOver = true;
        } else {
            // Pasar turno
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
    if (!localGame) throw new Error("No hay juego local encontrado");
    
    // 1. Movimiento Humano
    let newBoard = gameLogic.makeMove(localGame.board, player, row, col);
    const nextPlayer: Player = player === 'black' ? 'white' : 'black';
    
    let updates = updateLocalGameState(newBoard, nextPlayer);
    
    // 2. Movimiento IA (si es turno de IA y el juego no ha terminado)
    if (!updates.game_over && updates.current_player === 'white') {
        // Retraso artificial para realismo
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const aiMove = await aiService.getBestMove(updates.board!, 'white');
        if (aiMove) {
            newBoard = gameLogic.makeMove(updates.board!, 'white', aiMove.row, aiMove.col);
            // Después de que la IA mueve, verificar siguiente estado para Negras
            updates = updateLocalGameState(newBoard, 'black');
        } else {
             // IA no tiene movimientos (Pasar) - updateLocalGameState maneja esto
             updates = updateLocalGameState(newBoard, 'black');
        }
    }

    localGame = {
        ...localGame,
        ...updates
    } as BackendGameState;
    
    return localGame;
};


// --- API Pública ---

export const createGame = async (): Promise<BackendGameState> => {
  try {
    const response = await fetch(`${API_URL}/partida`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Error al iniciar juego');
    return await response.json();
  } catch (error) {
    console.warn("Backend no disponible. Iniciando Modo Offline.", error);
    return createLocalGame();
  }
};

export const makeMove = async (gameId: string, row: number, col: number, player: Player): Promise<BackendGameState> => {
  // Si gameId indica juego local, omitir red
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
        throw new Error(err.detail || 'Error al realizar movimiento');
    }
    return await response.json();
  } catch (error) {
    console.error("Conexión API perdida durante movimiento.");
    throw error;
  }
};