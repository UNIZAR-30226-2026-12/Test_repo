import uuid
from typing import List, Optional, Literal, Dict, Tuple
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import copy

app = FastAPI(title="Reversi AI Backend")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Types & Constants ---
Player = Literal['black', 'white']
Cell = Optional[Player]
Board = List[List[Cell]]
BOARD_SIZE = 8

# Position weights for Heuristic Evaluation
POSITION_WEIGHTS = [
    [100, -20, 10, 5, 5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [10, -2, -1, -1, -1, -1, -2, 10],
    [5, -2, -1, -1, -1, -1, -2, 5],
    [5, -2, -1, -1, -1, -1, -2, 5],
    [10, -2, -1, -1, -1, -1, -2, 10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10, 5, 5, 10, -20, 100]
]

DIRECTIONS = [
    (-1, -1), (-1, 0), (-1, 1),
    (0, -1),           (0, 1),
    (1, -1),  (1, 0),  (1, 1)
]

# --- Models ---

class GameState(BaseModel):
    game_id: str
    board: Board
    current_player: Optional[Player] # None if game over
    winner: Optional[str] # 'black', 'white', 'draw', None
    game_over: bool
    score: Dict[str, int]

class MoveRequest(BaseModel):
    game_id: str
    row: int
    col: int
    player: Player

# --- In-Memory Storage ---
games_db: Dict[str, GameState] = {}

# --- Game Logic Functions ---

def create_initial_board() -> Board:
    board = [[None for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]
    mid = BOARD_SIZE // 2
    board[mid - 1][mid - 1] = 'white'
    board[mid][mid] = 'white'
    board[mid - 1][mid] = 'black'
    board[mid][mid - 1] = 'black'
    return board

def is_on_board(r: int, c: int) -> bool:
    return 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE

def get_valid_moves(board: Board, player: Player) -> List[Tuple[int, int]]:
    moves = []
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            if is_valid_move(board, player, r, c):
                moves.append((r, c))
    return moves

def is_valid_move(board: Board, player: Player, row: int, col: int) -> bool:
    if board[row][col] is not None:
        return False
    
    opponent = 'white' if player == 'black' else 'black'
    
    for dr, dc in DIRECTIONS:
        r, c = row + dr, col + dc
        found_opponent = False
        
        while is_on_board(r, c):
            cell = board[r][c]
            if cell == opponent:
                found_opponent = True
            elif cell == player:
                if found_opponent:
                    return True
                break
            else: # cell is None
                break
            r += dr
            c += dc
            
    return False

def apply_move(board: Board, player: Player, row: int, col: int) -> Board:
    new_board = copy.deepcopy(board)
    new_board[row][col] = player
    opponent = 'white' if player == 'black' else 'black'

    for dr, dc in DIRECTIONS:
        r, c = row + dr, col + dc
        to_flip = []
        while is_on_board(r, c):
            cell = new_board[r][c]
            if cell == opponent:
                to_flip.append((r, c))
            elif cell == player:
                for fr, fc in to_flip:
                    new_board[fr][fc] = player
                break
            else:
                break
            r += dr
            c += dc
    return new_board

def count_score(board: Board) -> Dict[str, int]:
    black = sum(row.count('black') for row in board)
    white = sum(row.count('white') for row in board)
    return {"black": black, "white": white}

# --- AI Logic (Minimax + Alpha Beta) ---

def evaluate_board(board: Board, player: Player) -> int:
    opponent = 'white' if player == 'black' else 'black'
    score = 0
    
    counts = count_score(board)
    total_discs = counts['black'] + counts['white']
    
    # Position weights
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            if board[r][c] == player:
                score += POSITION_WEIGHTS[r][c]
            elif board[r][c] == opponent:
                score -= POSITION_WEIGHTS[r][c]
    
    # Mobility
    my_moves = len(get_valid_moves(board, player))
    op_moves = len(get_valid_moves(board, opponent))
    score += (my_moves - op_moves) * 5
    
    return score

def minimax(board: Board, depth: int, alpha: float, beta: float, maximizing: bool, player: Player) -> float:
    opponent = 'white' if player == 'black' else 'black'
    
    valid_moves_max = get_valid_moves(board, player)
    valid_moves_min = get_valid_moves(board, opponent)
    
    # Terminal condition
    if depth == 0 or (not valid_moves_max and not valid_moves_min):
        return evaluate_board(board, player)

    if maximizing:
        if not valid_moves_max:
            # Pass turn
            return minimax(board, depth - 1, alpha, beta, False, player)
        
        max_eval = float('-inf')
        for r, c in valid_moves_max:
            new_board = apply_move(board, player, r, c)
            eval_val = minimax(new_board, depth - 1, alpha, beta, False, player)
            max_eval = max(max_eval, eval_val)
            alpha = max(alpha, eval_val)
            if beta <= alpha:
                break
        return max_eval
    else:
        if not valid_moves_min:
            # Pass turn
            return minimax(board, depth - 1, alpha, beta, True, player)
            
        min_eval = float('inf')
        for r, c in valid_moves_min:
            new_board = apply_move(board, opponent, r, c)
            eval_val = minimax(new_board, depth - 1, alpha, beta, True, player)
            min_eval = min(min_eval, eval_val)
            beta = min(beta, eval_val)
            if beta <= alpha:
                break
        return min_eval

def get_best_move(board: Board, player: Player) -> Optional[Tuple[int, int]]:
    valid_moves = get_valid_moves(board, player)
    if not valid_moves:
        return None
    
    best_val = float('-inf')
    best_move = valid_moves[0]
    
    # Depth 4 is a good balance for Reversi performance in Python
    MAX_DEPTH = 4 
    
    for r, c in valid_moves:
        new_board = apply_move(board, player, r, c)
        val = minimax(new_board, MAX_DEPTH - 1, float('-inf'), float('inf'), False, player)
        if val > best_val:
            best_val = val
            best_move = (r, c)
            
    return best_move

# --- Helper to Check Game Over ---
def check_game_state(board: Board, next_player: Player) -> Tuple[bool, Optional[str], Optional[Player]]:
    """Returns (is_game_over, winner, next_actual_player)"""
    
    p1_moves = get_valid_moves(board, next_player)
    
    if p1_moves:
        return False, None, next_player
        
    # If next player has no moves, check the other player (Pass turn)
    other_player = 'white' if next_player == 'black' else 'black'
    p2_moves = get_valid_moves(board, other_player)
    
    if p2_moves:
        # Pass turn back to other player
        return False, None, other_player
    
    # Both have no moves -> Game Over
    counts = count_score(board)
    if counts['black'] > counts['white']:
        return True, 'black', None
    elif counts['white'] > counts['black']:
        return True, 'white', None
    else:
        return True, 'draw', None

# --- Endpoints ---

@app.post("/partida", response_model=GameState)
async def create_game():
    game_id = str(uuid.uuid4())
    board = create_initial_board()
    
    state = GameState(
        game_id=game_id,
        board=board,
        current_player='black',
        winner=None,
        game_over=False,
        score={"black": 2, "white": 2}
    )
    games_db[game_id] = state
    return state

@app.post("/movimiento", response_model=GameState)
async def make_move(move_req: MoveRequest):
    game_id = move_req.game_id
    if game_id not in games_db:
        raise HTTPException(status_code=404, detail="Partida no encontrada")
    
    game = games_db[game_id]
    
    if game.game_over:
        raise HTTPException(status_code=400, detail="El juego ha terminado")
        
    if move_req.player != game.current_player:
        raise HTTPException(status_code=400, detail="No es tu turno")
        
    if not is_valid_move(game.board, move_req.player, move_req.row, move_req.col):
        raise HTTPException(status_code=400, detail="Movimiento inválido")
        
    # 1. Apply Human Move
    game.board = apply_move(game.board, move_req.player, move_req.row, move_req.col)
    
    # 2. Determine next logic step
    next_turn_player = 'white' if move_req.player == 'black' else 'black'
    game_over, winner, actual_next = check_game_state(game.board, next_turn_player)
    
    game.game_over = game_over
    game.winner = winner
    game.current_player = actual_next
    game.score = count_score(game.board)
    
    # 3. AI Turn (If it's AI's turn and game is not over)
    # Assuming AI plays White
    if not game.game_over and game.current_player == 'white':
        ai_move = get_best_move(game.board, 'white')
        if ai_move:
            game.board = apply_move(game.board, 'white', ai_move[0], ai_move[1])
            
            # Check after AI move
            game_over, winner, actual_next_after_ai = check_game_state(game.board, 'black')
            game.game_over = game_over
            game.winner = winner
            game.current_player = actual_next_after_ai
            game.score = count_score(game.board)

    # Save and return
    games_db[game_id] = game
    return game
