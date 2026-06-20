// Test suite for Chess game logic
const chess = require('../games/chess');

describe('Chess Game Logic', () => {
  let game;

  beforeEach(() => {
    game = chess.createGame('test-game');
  });

  test('Game initializes with correct board state', () => {
    expect(game.board).toBeDefined();
    expect(game.board.length).toBe(8);
    // Check white pieces are at bottom
    expect(game.board[7][0].type).toBe('r');
    expect(game.board[7][0].color).toBe('w');
    // Check black pieces are at top
    expect(game.board[0][0].type).toBe('r');
    expect(game.board[0][0].color).toBe('b');
    // Check pawns
    expect(game.board[6][0].type).toBe('p');
    expect(game.board[6][0].color).toBe('w');
  });

  test('White starts first', () => {
    expect(game.turn).toBe('w');
  });

  test('Valid pawn move succeeds', () => {
    const result = chess.applyMove(game, '6-0', '5-0', 'w');
    expect(result.ok).toBe(true);
    expect(game.board[5][0].type).toBe('p');
    expect(game.board[5][0].color).toBe('w');
    expect(game.board[6][0]).toBeNull();
    expect(game.turn).toBe('b');
  });

  test('Pawn can move two squares from start', () => {
    const result = chess.applyMove(game, '6-0', '4-0', 'w');
    expect(result.ok).toBe(true);
    expect(game.board[4][0].type).toBe('p');
  });

  test('Pawn cannot move backward', () => {
    game.board[5][0] = { type: 'p', color: 'w' };
    game.board[6][0] = null;
    const result = chess.applyMove(game, '5-0', '6-0', 'w');
    expect(result.ok).toBe(false);
  });

  test('Knight move succeeds', () => {
    const result = chess.applyMove(game, '7-1', '5-2', 'w');
    expect(result.ok).toBe(true);
    expect(game.board[5][2].type).toBe('n');
  });

  test('Bishop move succeeds diagonally', () => {
    // Move pawn first to clear diagonal
    chess.applyMove(game, '6-4', '5-4', 'w');
    chess.applyMove(game, '1-4', '2-4', 'b');
    const result = chess.applyMove(game, '7-5', '5-3', 'w');
    expect(result.ok).toBe(true);
    expect(game.board[5][3].type).toBe('b');
  });

  test('Rook cannot move diagonally', () => {
    // Try diagonal rook move
    const result = chess.applyMove(game, '7-0', '6-1', 'w');
    expect(result.ok).toBe(false);
  });

  test('King move succeeds one square', () => {
    game.board[5][4] = null; // Clear path
    game.board[4][4] = null; // Clear path
    game.board[6][4] = { type: 'k', color: 'w' };
    game.board[7][4] = null;
    game.turn = 'w';
    
    const result = chess.applyMove(game, '6-4', '5-4', 'w');
    expect(result.ok).toBe(true);
  });

  test('Queen moves like rook (horizontal)', () => {
    // Move pawn first
    chess.applyMove(game, '6-3', '5-3', 'w');
    chess.applyMove(game, '1-3', '2-3', 'b');
    const result = chess.applyMove(game, '7-3', '6-3', 'w');
    expect(result.ok).toBe(true);
    expect(game.board[6][3].type).toBe('q');
  });

  test('Pawn promotion on reaching end', () => {
    game.board[1][0] = { type: 'p', color: 'w' };
    game.board[6][0] = null;
    game.turn = 'w';
    
    const result = chess.applyMove(game, '1-0', '0-0', 'w');
    expect(result.ok).toBe(true);
    expect(game.board[0][0].type).toBe('q'); // promoted to queen
  });

  test('Cannot move to occupied square of own color', () => {
    const result = chess.applyMove(game, '7-0', '7-1', 'w');
    expect(result.ok).toBe(false);
  });

  test('Capture opponent piece succeeds', () => {
    game.board[4][4] = { type: 'p', color: 'w' };
    game.board[6][4] = null;
    game.board[3][5] = { type: 'p', color: 'b' };
    game.board[1][5] = null;
    game.turn = 'w';
    
    const result = chess.applyMove(game, '4-4', '3-5', 'w');
    expect(result.ok).toBe(true);
    expect(game.board[3][5].color).toBe('w');
  });

  test('getAllMoves returns valid moves for white', () => {
    const moves = chess.getAllMoves(game, 'w');
    expect(moves).toBeDefined();
    expect(moves.length).toBeGreaterThan(0);
  });

  test('Move history is recorded', () => {
    chess.applyMove(game, '6-0', '5-0', 'w');
    expect(game.moveHistory.length).toBe(1);
    expect(game.moveHistory[0].from).toBe('6-0');
    expect(game.moveHistory[0].to).toBe('5-0');
  });

  test('Invalid positions are rejected', () => {
    const result = chess.applyMove(game, 'invalid', '5-0', 'w');
    expect(result.ok).toBe(false);
  });
});
