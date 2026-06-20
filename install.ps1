# Automated installer for the MERN Digital Board Game Platform (Windows PowerShell)
# Usage: Run from PowerShell in the project root: `.\
# Automated installer for the MERN Digital Board Game Platform (Windows PowerShell)
# Usage: Run from PowerShell in the project root: .\install.ps1

function Check-Command($cmd){
	$null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

if (-not (Check-Command node)){
	Write-Host "Node.js is not installed or not in PATH. Install Node.js (https://nodejs.org/) and rerun." -ForegroundColor Yellow
	exit 1
}

if (-not (Check-Command npm)){
	Write-Host "npm not found. Ensure Node.js installation includes npm." -ForegroundColor Yellow
	exit 1
}

Write-Host "Creating backend and frontend scaffolds..." -ForegroundColor Cyan

$root = Get-Location

# Backend
$backend = Join-Path $root 'backend'
if (-not (Test-Path $backend)){
	New-Item -ItemType Directory -Path $backend | Out-Null
	Push-Location $backend
	npm init -y | Out-Null
	npm install express mongoose socket.io cors dotenv bcryptjs jsonwebtoken | Out-Null
	npm install --save-dev nodemon | Out-Null

	@'
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

io.on('connection', socket => {
  console.log('socket connected', socket.id);
  socket.on('join-game', (gameId) => socket.join(gameId));
  socket.on('leave-game', (gameId) => socket.leave(gameId));
  socket.on('move', (data) => {
	// validate and apply move on server-side game logic (implement later)
	io.to(data.gameId).emit('move', data);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
'@ | Out-File -Encoding utf8 server.js

	@'
# Example environment variables
MONGO_URI=mongodb://localhost:27017/boardgame
JWT_SECRET=change-me
PORT=4000
'@ | Out-File -Encoding utf8 .env.example

	Pop-Location
} else {
	Write-Host "backend/ already exists — skipping backend scaffold." -ForegroundColor Yellow
}

# Frontend (Create React App)
$frontend = Join-Path $root 'frontend'
if (-not (Test-Path $frontend)){
	Write-Host "Scaffolding React app (this may take a few minutes)..." -ForegroundColor Cyan
	npx create-react-app frontend --use-npm | Out-Null
	Push-Location $frontend
	npm install socket.io-client axios react-router-dom | Out-Null
	Pop-Location
} else {
	Write-Host "frontend/ already exists — skipping frontend scaffold." -ForegroundColor Yellow
}

Write-Host "Done. To run: start backend then frontend." -ForegroundColor Green
Write-Host "Backend: cd backend; npx nodemon server.js" -ForegroundColor Cyan
Write-Host "Frontend: cd frontend; npm start" -ForegroundColor Cyan

exit 0