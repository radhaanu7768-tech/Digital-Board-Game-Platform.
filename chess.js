// Chess game logic - server-side validation and state management
function getInitialBoard(){
  // 8x8 board: row 0 is black's side, row 7 is white's side
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Black pieces (top)
  board[0] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'].map(p => ({ type: p, color: 'b' }));
  board[1] = Array(8).fill(null).map(() => ({ type: 'p', color: 'b' }));
  
  // White pieces (bottom)
  board[6] = Array(8).fill(null).map(() => ({ type: 'p', color: 'w' }));
  board[7] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'].map(p => ({ type: p, color: 'w' }));
  
  return board;
}

function createGame(id){
  return {
    id: id,
    board: getInitialBoard(),
    turn: 'w',
    playerMap: {},
    moveHistory: [],
    winner: null,
    inCheck: null
  };
}

function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8 }

function parsePos(pos){
  if(!pos || typeof pos !== 'string') return null;
  const parts = pos.split('-').map(Number);
  if(parts.length!==2) return null;
  return {r:parts[0], c:parts[1]};
}

// Simple pawn move logic
function getPawnMoves(board, r, c, color){
  const moves = [];
  const dir = (color==='w')? -1 : 1;
  const startRow = (color==='w')? 6 : 1;
  
  // Forward move
  const nr = r + dir;
  if(inBounds(nr,c) && !board[nr][c]){
    moves.push({r:nr, c:c});
    // Two squares from start
    if(r === startRow){
      const nr2 = r + 2*dir;
      if(inBounds(nr2,c) && !board[nr2][c]) moves.push({r:nr2, c:c});
    }
  }
  
  // Captures
  for(const dc of [-1,1]){
    const nr = r + dir, nc = c + dc;
    if(inBounds(nr,nc) && board[nr][nc] && board[nr][nc].color !== color){
      moves.push({r:nr, c:nc});
    }
  }
  
  return moves;
}

// Knight moves
function getKnightMoves(board, r, c, color){
  const moves = [];
  const dirs = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
  for(const [dr,dc] of dirs){
    const nr = r + dr, nc = c + dc;
    if(inBounds(nr,nc) && (!board[nr][nc] || board[nr][nc].color !== color)){
      moves.push({r:nr, c:nc});
    }
  }
  return moves;
}

// Bishop/Rook/Queen sliding moves
function getSlidingMoves(board, r, c, color, dirs){
  const moves = [];
  for(const [dr,dc] of dirs){
    for(let i=1; i<8; i++){
      const nr = r + dr*i, nc = c + dc*i;
      if(!inBounds(nr,nc)) break;
      if(!board[nr][nc]){
        moves.push({r:nr, c:nc});
      } else {
        if(board[nr][nc].color !== color) moves.push({r:nr, c:nc});
        break;
      }
    }
  }
  return moves;
}

function getRookMoves(board, r, c, color){
  return getSlidingMoves(board, r, c, color, [[0,1],[0,-1],[1,0],[-1,0]]);
}

function getBishopMoves(board, r, c, color){
  return getSlidingMoves(board, r, c, color, [[1,1],[1,-1],[-1,1],[-1,-1]]);
}

function getQueenMoves(board, r, c, color){
  return getSlidingMoves(board, r, c, color, [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]);
}

function getKingMoves(board, r, c, color){
  const moves = [];
  for(let dr=-1; dr<=1; dr++){
    for(let dc=-1; dc<=1; dc++){
      if(dr===0 && dc===0) continue;
      const nr = r + dr, nc = c + dc;
      if(inBounds(nr,nc) && (!board[nr][nc] || board[nr][nc].color !== color)){
        moves.push({r:nr, c:nc});
      }
    }
  }
  return moves;
}

function getMovesForPiece(board, r, c, color){
  const piece = board[r][c];
  if(!piece || piece.color !== color) return [];
  
  switch(piece.type){
    case 'p': return getPawnMoves(board, r, c, color);
    case 'n': return getKnightMoves(board, r, c, color);
    case 'b': return getBishopMoves(board, r, c, color);
    case 'r': return getRookMoves(board, r, c, color);
    case 'q': return getQueenMoves(board, r, c, color);
    case 'k': return getKingMoves(board, r, c, color);
    default: return [];
  }
}

function applyMove(game, fromPos, toPos, color){
  if(game.winner) return { ok:false, reason:'game over' };
  if(game.turn !== color) return { ok:false, reason:'not your turn' };
  
  const from = parsePos(fromPos);
  const to = parsePos(toPos);
  if(!from || !to) return { ok:false, reason:'bad pos' };
  if(!inBounds(from.r,from.c) || !inBounds(to.r,to.c)) return { ok:false, reason:'out of bounds' };
  
  const piece = game.board[from.r][from.c];
  if(!piece || piece.color !== color) return { ok:false, reason:'no piece or not your color' };
  
  const moves = getMovesForPiece(game.board, from.r, from.c, color);
  const validMove = moves.some(m => m.r === to.r && m.c === to.c);
  if(!validMove) return { ok:false, reason:'invalid move for this piece' };
  
  // Perform move
  game.board[to.r][to.c] = piece;
  game.board[from.r][from.c] = null;
  
  // Pawn promotion
  if(piece.type === 'p' && (to.r === 0 || to.r === 7)){
    piece.type = 'q'; // promote to queen
  }
  
  // Record move
  game.moveHistory.push({ from: fromPos, to: toPos, color });
  
  // Switch turn
  game.turn = (game.turn === 'w') ? 'b' : 'w';
  
  // Check for checkmate/stalemate (simplified: just check if opponent has moves)
  const opponentColor = (color === 'w') ? 'b' : 'w';
  let hasLegalMoves = false;
  outer: for(let r=0; r<8; r++){
    for(let c=0; c<8; c++){
      if(game.board[r][c] && game.board[r][c].color === opponentColor){
        if(getMovesForPiece(game.board, r, c, opponentColor).length > 0){
          hasLegalMoves = true;
          break outer;
        }
      }
    }
  }
  
  if(!hasLegalMoves) game.winner = color;
  
  return { ok: true, game };
}

function getAllMoves(game, color){
  const moves = [];
  for(let r=0; r<8; r++){
    for(let c=0; c<8; c++){
      if(game.board[r][c] && game.board[r][c].color === color){
        const pieceMoves = getMovesForPiece(game.board, r, c, color);
        for(const m of pieceMoves){
          moves.push({ from: `${r}-${c}`, to: `${m.r}-${m.c}` });
        }
      }
    }
  }
  return moves;
}

module.exports = { createGame, applyMove, getAllMoves };
