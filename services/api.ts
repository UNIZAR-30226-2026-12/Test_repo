import { Player, BoardState, Coordinates } from '../types';

/**
 * En entornos de desarrollo locales, el backend suele estar en el puerto 8000.
 * En entornos de sandbox/cloud, el backend suele servirse en el mismo host.
 */
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Si estamos en localhost pero en un puerto distinto, intentamos apuntar al 8000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    // En otros entornos (sandboxes), asumimos que el backend está en la misma raíz
    return window.location.origin;
  }
  return '';
};

const API_URL = getBaseUrl();

export interface BackendGameState {
  game_id: string;
  board: BoardState;
  current_player: Player;
  winner: Player | 'draw' | null;
  game_over: boolean;
  score: { black: number; white: number };
  valid_moves: Coordinates[];
  last_move?: Coordinates | null;
}

export const createGame = async (): Promise<BackendGameState> => {
  const response = await fetch(`${API_URL}/partida`, { 
    method: 'POST',
    mode: 'cors'
  });
  if (!response.ok) throw new Error('Servidor no responde');
  return await response.json();
};

export const makeMove = async (gameId: string, row: number, col: number, player: Player): Promise<BackendGameState> => {
  const response = await fetch(`${API_URL}/movimiento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game_id: gameId, row, col, player }),
    mode: 'cors'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error en el servidor');
  }
  return await response.json();
};
