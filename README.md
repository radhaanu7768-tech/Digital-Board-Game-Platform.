# Digital Board Game Platform - MVP

A multiplayer turn-based board game platform featuring Checkers with AI support, real-time WebSocket communication, user authentication, and persistent game state.

## Tech Stack (MERN)

- **Backend**: Node.js + Express + Socket.io + MongoDB
- **Frontend**: Static HTML/CSS/JS (with React coming soon)
- **Real-time**: Socket.io for live game updates and chat
- **Database**: MongoDB for user persistence and stats
- **Game Logic**: Server-side validation to prevent cheating

## Features Implemented

✅ Server-side Checkers game logic (board state, move validation, captures)
✅ AI opponent (server-side Minimax-like strategy)
✅ Real-time multiplayer with Socket.io
✅ User authentication (sign-in/register with password hashing)
✅ In-game chat
✅ Guest mode
✅ Colorful UI with game mode selector

## Installation

### Prerequisites
- **Node.js** (v16+): https://nodejs.org/
- **MongoDB** (local or Atlas): https://www.mongodb.com/

### Quick Setup

1. **Clone/enter the project**
```bash
cd "New folder (2)"
```

2. **Run the automated installer** (first-time only)
```powershell
.\install.ps1
```

3. **Install backend dependencies** (if not done by installer)
```bash
cd backend
npm install
```

4. **Configure environment**
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and update MONGO_URI if needed:
# MONGO_URI=mongodb://localhost:27017/boardgame
```

## Running the Application

### Start MongoDB (local)
```bash
# Windows: use MongoDB Compass or run mongod in a separate terminal
mongod --dbpath "C:\path\to\data"
```

### Start Backend Server
```bash
cd backend
npx nodemon server.js
# Server runs on http://localhost:4000
```

### Open Frontend
- Open http://localhost:4000 in your browser
- Sign in / register, then choose a game mode

## Game Modes

### 🔴 Checkers vs Player
- Create a game, share Game ID with another player
- Each player controls red (top) or blue (bottom) pieces
- Click piece to select, click destination to move

### 🤖 Checkers vs AI
- Play against server-side AI opponent
- AI prefers capture moves and responds after ~600ms
- You play as red (top), AI plays as blue (bottom)

### 🎲 Multiplayer Lobby
- Join or create public games
- Real-time game state updates via WebSocket
- In-game chat support

## Project Structure

```
.
├── index.html              # Landing/lobby page (sign-in + game modes)
├── install.ps1             # Automated installation script
├── frontend/
│   ├── index.html          # Game board UI
│   ├── style.css           # Board styling (colorful)
│   └── app.js              # Client-side game logic
└── backend/
    ├── server.js           # Express + Socket.io + auth endpoint
    ├── .env.example        # Environment variables template
    ├── package.json        # Dependencies
    ├── models/
    │   └── User.js         # MongoDB user schema + auth
    └── games/
        └── checkers.js     # Game logic, move validation, AI
```

## API Endpoints

### POST /api/auth
Sign in or register a user
```json
{
  "username": "player1",
  "password": "secret123"
}
```
Response:
```json
{
  "ok": true,
  "user": { "id": "...", "username": "player1", "elo": 1200 }
}
```

### GET /api/health
Health check
```json
{ "status": "ok" }
```

## WebSocket Events

### Client → Server
- `join-game(gameId)` – Join or create a game
- `create-ai-game(gameId)` – Start an AI game
- `leave-game(gameId)` – Leave the game
- `move({gameId, from, to})` – Submit a move
- `chat({gameId, text})` – Send a chat message
- `request-ai-move(gameId)` – Request immediate AI move

### Server → Client
- `player-assigned({color})` – You are assigned 'r' (red) or 'b' (blue)
- `game-state({board, turn, winner})` – Authoritative game state after each move
- `invalid-move(reason)` – Your move was rejected
- `chat({from, text, gameId})` – Incoming chat message

## Checkers Rules (MVP)

- **Board**: 8x8 grid, pieces only on dark squares
- **Starting Position**: Red pieces on rows 0-2, Blue pieces on rows 5-7
- **Move**: Diagonal step forward (1 square) to an empty cell
- **Capture**: Diagonal jump (2 squares) over an opponent piece
- **Win**: Eliminate all opponent pieces
- **No Kinging**: (v2 feature)

## Known Limitations

- No multi-capture sequences yet (v2)
- No kinging mechanic (v2)
- Chess not yet implemented
- No persistent game history
- No ELO rating updates
- No matchmaking algorithm (v2)

## Next Steps

1. Implement full Checkers rules (kinging, multi-capture)
2. Add Chess game logic
3. Replace static frontend with React + polished UI
4. Implement ELO rating system and matchmaking
5. Add game replay and statistics
6. Deploy to production (Heroku/Railway + MongoDB Atlas)

## Troubleshooting

### "MongoDB connection error"
- Ensure MongoDB is running locally (`mongod`)
- Or update `MONGO_URI` in `.env` to a remote MongoDB Atlas connection string

### "Socket not connecting"
- Ensure backend server is running on port 4000
- Check browser console for errors (F12)
- CORS should allow `*` by default

### "Auth endpoint not found"
- Ensure backend is serving the root directory (index.html should load from http://localhost:4000)

## Development

To add new features:
1. Update game logic in `backend/games/checkers.js`
2. Add Socket.io events in `backend/server.js`
3. Update frontend listeners in `frontend/app.js`
4. Test with two browser tabs (simulate multiplayer)

## License

MIT

---

**Have fun playing!** 🎮
