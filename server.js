require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const checkers = require('./games/checkers');
const chess = require('./games/chess');
const MatchmakingQueue = require('./matchmaking');
const User = require('./models/User');

// In-memory games store (for MVP)
const games = {};
const matchmakingQueue = new MatchmakingQueue();

app.use(cors());
app.use(express.json());
// Serve frontend static files if built or present in ../frontend
const path = require('path');
const frontendPath = path.join(__dirname, '..', 'frontend');
if (require('fs').existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));
  

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auth endpoint: sign in or register
app.post('/api/auth', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ ok: false, message: 'username and password required' });

  try {
    // Try to find user
    let user = await User.findOne({ username });
    if (user) {
      // User exists: verify password
      if (user.verifyPassword(password)) {
        return res.json({ ok: true, user: { id: user._id, username: user.username, elo: user.elo } });
      } else {
        return res.json({ ok: false, message: 'invalid password' });
      }
    } else {
      // Create new user
      const passwordHash = User.hashPassword(password);
      user = new User({ username, passwordHash });
      await user.save();
      return res.json({ ok: true, user: { id: user._id, username: user.username, elo: user.elo } });
    }
  } catch (e) {
    console.error('Auth error:', e);
    res.json({ ok: false, message: e.message });
  }
});

// Matchmaking endpoints
app.get('/api/queue-stats/:gameType', (req, res) => {
  const stats = matchmakingQueue.getQueueStats(req.params.gameType);
  res.json(stats);
});

app.post('/api/matchmaking/queue', async (req, res) => {
  const { userId, gameType } = req.body;
  if (!userId || !gameType) return res.json({ ok: false, message: 'userId and gameType required' });
  
  try {
    const user = await User.findById(userId);
    if (!user) return res.json({ ok: false, message: 'user not found' });
    
    // Queue stats only - actual matching happens via WebSocket
    const stats = matchmakingQueue.getQueueStats(gameType);
    res.json({ ok: true, waiting: stats.waiting, yourElo: user.elo });
  } catch (e) {
    res.json({ ok: false, message: e.message });
  }
});

io.on('connection', socket => {
  console.log('socket connected', socket.id);

  socket.on('join-game', (gameId) => {
    socket.join(gameId);
    if(!games[gameId]) games[gameId] = checkers.createGame(gameId);
    const game = games[gameId];
    // assign player color if not assigned and less than 2 players
    if(!game.playerMap[socket.id] && Object.keys(game.playerMap).length < 2){
      const assigned = (Object.keys(game.playerMap).length===0)? 'r' : 'b';
      game.playerMap[socket.id] = assigned;
      socket.emit('player-assigned', { color: assigned });
      console.log('assigned',socket.id,assigned,'in',gameId);
    }
    io.to(gameId).emit('game-state', { board: game.board, turn: game.turn, winner: game.winner });
  });

  socket.on('create-ai-game', (gameId) => {
    const id = gameId || ('g-'+Math.random().toString(36).slice(2,9));
    socket.join(id);
    if(!games[id]) games[id] = checkers.createGame(id);
    const game = games[id];
    // assign human as 'r' and AI as 'b'
    game.playerMap[socket.id] = 'r';
    game.ai = 'b';
    socket.emit('player-assigned', { color: 'r' });
    io.to(id).emit('game-state', { board: game.board, turn: game.turn, winner: game.winner });
  });

  socket.on('create-ai-vs-ai-game', (gameId) => {
    const id = gameId || ('g-'+Math.random().toString(36).slice(2,9));
    socket.join(id);
    if(!games[id]) games[id] = checkers.createGame(id);
    const game = games[id];
    game.ai = 'b';
    game.ai2 = 'r';
    game.playerMap[socket.id] = 'r';
    socket.emit('player-assigned', { color: 'r' });
    io.to(id).emit('game-state', { board: game.board, turn: game.turn, winner: game.winner });
    setTimeout(()=> performAIMove(id), 600);
  });

  socket.on('create-chess-ai-vs-ai-game', (gameId) => {
    const id = gameId || ('chess-'+Math.random().toString(36).slice(2,9));
    socket.join(id);
    if(!games[id]) games[id] = chess.createGame(id);
    const game = games[id];
    game.ai = 'b';
    game.ai2 = 'w';
    game.playerMap[socket.id] = 'w';
    socket.emit('player-assigned', { color: 'w' });
    io.to(id).emit('game-state', { board: game.board, turn: game.turn, winner: game.winner });
    setTimeout(()=> performAIMove(id), 600);
  });

  socket.on('leave-game', (gameId) => {
    socket.leave(gameId);
    const game = games[gameId];
    if(game){ delete game.playerMap[socket.id]; io.to(gameId).emit('game-state', { board: game.board, turn: game.turn, winner: game.winner }); }
  });

  socket.on('join-chess-game', (gameId) => {
    socket.join(gameId);
    if(!games[gameId]) games[gameId] = chess.createGame(gameId);
    const game = games[gameId];
    if(!game.playerMap[socket.id] && Object.keys(game.playerMap).length < 2){
      const assigned = (Object.keys(game.playerMap).length===0)? 'w' : 'b';
      game.playerMap[socket.id] = assigned;
      socket.emit('player-assigned', { color: assigned });
      console.log('assigned',socket.id,assigned,'in',gameId);
    }
    io.to(gameId).emit('game-state', { board: game.board, turn: game.turn, winner: game.winner });
  });

  socket.on('create-chess-ai-game', (gameId) => {
    const id = gameId || ('chess-'+Math.random().toString(36).slice(2,9));
    socket.join(id);
    if(!games[id]) games[id] = chess.createGame(id);
    const game = games[id];
    game.playerMap[socket.id] = 'w';
    game.ai = 'b';
    socket.emit('player-assigned', { color: 'w' });
    io.to(id).emit('game-state', { board: game.board, turn: game.turn, winner: game.winner });
  });

  socket.on('move', (data) => {
    // expect { gameId, from, to }
    const game = games[data.gameId];
    if(!game){ socket.emit('invalid-move', 'game not found'); return }
    const color = game.playerMap[socket.id];
    if(!color){ socket.emit('invalid-move', 'not a player'); return }
    
    // Detect game type and apply appropriate logic
    let res;
    if(game.board && game.board[0] && game.board[0][0] && game.board[0][0].type){
      // Chess game
      res = chess.applyMove(game, data.from, data.to, color);
    } else {
      // Checkers game
      res = checkers.applyMove(game, data.from, data.to, color);
    }
    
    if(!res.ok){ socket.emit('invalid-move', res.reason); return }
    io.to(data.gameId).emit('game-state', { board: game.board, turn: game.turn, winner: game.winner });
    // if this game has an AI and it's AI's turn, schedule AI move
    if(game.ai && game.turn === game.ai){
      setTimeout(()=> performAIMove(data.gameId), 600);
    }
  });

  socket.on('queue-join', (data) => {
    const { userId, gameType } = data;
    if (!userId || !gameType) return socket.emit('queue-error', 'invalid data');
    
    const match = matchmakingQueue.addPlayer(userId, 1200, socket.id, gameType);
    if (match) {
      // Matched! Create game and notify both players
      const gameId = `${gameType}-${Math.random().toString(36).slice(2,9)}`;
      let game;
      if (gameType === 'chess') {
        game = chess.createGame(gameId);
      } else {
        game = checkers.createGame(gameId);
      }
      game.playerMap[match.player1.socketId] = (gameType === 'chess') ? 'w' : 'r';
      game.playerMap[match.player2.socketId] = (gameType === 'chess') ? 'b' : 'b';
      games[gameId] = game;
      
      io.to(match.player1.socketId).emit('match-found', { gameId, opponent: match.player2.userId });
      io.to(match.player2.socketId).emit('match-found', { gameId, opponent: match.player1.userId });
    } else {
      socket.emit('queued', { position: (matchmakingQueue.queues[gameType] || []).length });
    }
  });

  socket.on('queue-leave', (gameType) => {
    matchmakingQueue.removePlayer(socket.id, gameType);
  });

  socket.on('chat', (data) => {
    if (data && data.gameId) io.to(data.gameId).emit('chat', { from: socket.id, text: data.text, gameId: data.gameId });
  });

  socket.on('request-ai-move', (gameId) => { if(games[gameId]) performAIMove(gameId); });
});

function performAIMove(gameId){
  const game = games[gameId];
  if(!game || (!game.ai && !game.ai2)) return;
  if(game.winner) return;

  const aiColor = (game.turn === game.ai2) ? game.ai2 : game.ai;
  if(!aiColor || game.turn !== aiColor) return;

  // Detect game type
  let moves, res;
  if(game.board && game.board[0] && game.board[0][0] && game.board[0][0].type){
    // Chess game
    moves = chess.getAllMoves(game, aiColor);
  } else {
    // Checkers game
    moves = checkers.getAllMoves(game, aiColor);
  }
  
  if(!moves || moves.length===0){
    // no moves -> lose
    game.winner = (aiColor==='r' || aiColor==='w')? ((aiColor==='r')?'b':'w') : ((aiColor==='b')?'r':'w');
    io.to(gameId).emit('game-state', { board: game.board, turn: game.turn, winner: game.winner });
    return;
  }
  // prefer capture moves
  const caps = moves.filter(m=>m.capture);
  const choice = (caps.length>0)? caps[Math.floor(Math.random()*caps.length)] : moves[Math.floor(Math.random()*moves.length)];
  
  if(game.board && game.board[0] && game.board[0][0] && game.board[0][0].type){
    res = chess.applyMove(game, choice.from, choice.to, aiColor);
  } else {
    res = checkers.applyMove(game, choice.from, choice.to, aiColor);
  }
  
  if(res.ok){
    io.to(gameId).emit('game-state', { board: game.board, turn: game.turn, winner: game.winner });
    // if AI still has turn (multi-capture), schedule again
    if(game.turn === aiColor) {
      setTimeout(()=> performAIMove(gameId), 400);
    } else if(game.ai2 && (game.turn === game.ai || game.turn === game.ai2)) {
      setTimeout(()=> performAIMove(gameId), 600);
    }
  }
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
