const checkers = {};

checkers.createGame = function(id) {
  return {
    id: id,
    board: this.initialBoard(),
    turn: 'red',
    status: 'waiting'
  };
};

checkers.initialBoard = function() {
  let board = [];
  for (let r = 0; r < 8; r++) {
    board[r] = [];
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) board[r][c] = 'B';
        else if (r > 4) board[r][c] = 'R';
        else board[r][c] = null;
      } else {
        board[r][c] = null;
      }
    }
  }
  return board;
};

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getAllMoves(game, color) {
  let moves = [];
  let directions = color === 'red'? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      let piece = game.board[r][c];
      if (piece && piece.toLowerCase() === color[0]) {
        for (let [dr, dc] of directions) {
          let jr = r + dr * 2, jc = c + dc * 2;
          if (inBounds(jr, jc) && game.board[jr][jc] === null) {
            let midr = r + dr, midc = c + dc;
            if (!inBounds(midr, midc)) continue;
            let mid = game.board[midr][midc];
            if (mid && mid.toLowerCase()!== color[0]) {
              moves.push({from: `${r}-${c}`, to: `${jr}-${jc}`, capture: true});
            }
          }
        }
      }
    }
  }
  return moves;
}

checkers.applyMove = function(game, fromPos, toPos, color) {
  return game;
};

module.exports = checkers;