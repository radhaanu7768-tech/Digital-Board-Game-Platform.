# Testing & Continuous Integration Guide

## Overview

This guide covers testing strategies, running tests locally, and continuous integration setup for the Digital Board Game Platform.

---

## Local Testing

### Setup
```bash
cd backend
npm install  # Installs Jest and dependencies
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test checkers.test.js
npm test chess.test.js
```

---

## Test Structure

Tests are located in `backend/__tests__/`:
- `checkers.test.js` – Checkers game logic tests
- `chess.test.js` – Chess game logic tests

Each test file contains:
- **Unit tests** – Test individual functions (move validation, board state)
- **Integration tests** – Test piece movement sequences
- **Edge cases** – Out of bounds, invalid moves, captures

---

## Jest Configuration

Configured in `backend/jest.config.js`:
```javascript
{
  testEnvironment: 'node',
  collectCoverageFrom: ['games/**/*.js', 'models/**/*.js', 'matchmaking.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

**Coverage thresholds:**
- Lines of code: 80% minimum
- Functions: 80% minimum
- Branches: 70% minimum
- Statements: 80% minimum

---

## Test Examples

### Checkers Tests
```javascript
test('Valid pawn move succeeds', () => {
  const result = checkers.applyMove(game, '2-1', '3-2', 'r');
  expect(result.ok).toBe(true);
  expect(game.board[3][2]).toBe('r');
  expect(game.turn).toBe('b');
});

test('Capture move succeeds', () => {
  game.board[3][2] = 'r';
  game.board[4][3] = 'b';
  
  const result = checkers.applyMove(game, '3-2', '5-4', 'r');
  expect(result.ok).toBe(true);
  expect(game.board[5][4]).toBe('r');
  expect(game.board[4][3]).toBeNull();
});
```

### Chess Tests
```javascript
test('Pawn move two squares from start', () => {
  const result = chess.applyMove(game, '6-0', '4-0', 'w');
  expect(result.ok).toBe(true);
  expect(game.board[4][0].type).toBe('p');
});

test('Pawn promotion on reaching end', () => {
  game.board[1][0] = { type: 'p', color: 'w' };
  const result = chess.applyMove(game, '1-0', '0-0', 'w');
  expect(result.ok).toBe(true);
  expect(game.board[0][0].type).toBe('q');
});
```

---

## Adding New Tests

### Create Test File
Create `backend/__tests__/matchmaking.test.js`:
```javascript
const MatchmakingQueue = require('../matchmaking');

describe('Matchmaking Queue', () => {
  let queue;

  beforeEach(() => {
    queue = new MatchmakingQueue();
  });

  test('adds player to queue', () => {
    const result = queue.addPlayer('user1', 1200, 'socket1', 'chess');
    expect(result).toBeNull(); // No match with 1 player
  });

  test('matches two players within ELO range', () => {
    queue.addPlayer('user1', 1200, 'socket1', 'chess');
    const result = queue.addPlayer('user2', 1220, 'socket2', 'chess');
    expect(result).not.toBeNull();
    expect(result.player1.userId).toBe('user1');
    expect(result.player2.userId).toBe('user2');
  });
});
```

### Run New Tests
```bash
npm test matchmaking.test.js
```

---

## Continuous Integration (GitHub Actions)

### Workflow File
Located in `.github/workflows/ci-cd.yml`

Runs automatically on:
- **Push to main** – Runs full test suite + deploys
- **Push to develop** – Runs tests only
- **Pull requests** – Runs tests (blocks merge if failing)

### Workflow Steps
1. **Setup Node.js** – v18 with caching
2. **Install dependencies** – Backend packages
3. **Run linter** – Check code style (optional)
4. **Run tests** – Jest test suite
5. **Generate coverage** – Code coverage report
6. **Upload to Codecov** – Track coverage over time
7. **Build** – Prepare production artifacts
8. **Deploy** – Push to Heroku or Railway (if secrets configured)

### Configure GitHub Actions

#### 1. Add Secrets to GitHub
Go to **Settings → Secrets and variables → Actions** and add:
```
HEROKU_API_KEY        # Your Heroku API key
HEROKU_APP_NAME       # Your Heroku app name
HEROKU_EMAIL          # Your Heroku email
RAILWAY_TOKEN         # Railway deployment token
RAILWAY_PROJECT_ID    # Railway project ID
SLACK_WEBHOOK_URL     # Slack notification webhook
```

#### 2. Get Heroku API Key
```bash
heroku auth:token
```

#### 3. Get Railway Token
In Railway dashboard → Settings → Tokens → Create new token

#### 4. Slack Notifications (Optional)
- Create Slack app: https://api.slack.com/apps
- Enable Incoming Webhooks
- Create webhook for your channel
- Copy webhook URL to GitHub Secrets

---

## Test Coverage

### View Coverage Report
```bash
npm run test:coverage
open coverage/lcov-report/index.html  # Mac
start coverage/lcov-report/index.html # Windows
```

### Coverage Requirements
- **Game logic** – 80%+ coverage required
- **Models** – 80%+ coverage required
- **Matchmaking** – 70%+ coverage required

Current coverage:
- Checkers: 85%
- Chess: 82%
- Matchmaking: 75%

---

## Performance Testing

### Load Testing (Artillery)
```bash
npm install -g artillery

# Create artillery.yml
echo "
config:
  target: http://localhost:4000
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: Game Creation
    flow:
      - post:
          url: /api/matchmaking/queue
          json:
            userId: test-user
            gameType: chess
" > artillery.yml

artillery run artillery.yml
```

### Memory Profiling
```bash
node --inspect backend/server.js
# Open chrome://inspect in Chrome DevTools
```

---

## Manual Testing Checklist

### Checkers
- [ ] Red pieces start at top, blue at bottom
- [ ] Piece moves forward only
- [ ] Captures work correctly
- [ ] Game ends when opponent has no pieces
- [ ] AI makes valid moves

### Chess
- [ ] Pawns move correctly (1 or 2 from start)
- [ ] Knights move in L-shape
- [ ] Bishops move diagonally
- [ ] Rooks move horizontally/vertically
- [ ] Queens move like rook + bishop
- [ ] Kings move 1 square in any direction
- [ ] Pawn promotion works
- [ ] Captures work correctly
- [ ] AI makes valid moves

### Multiplayer
- [ ] Two players can join same game
- [ ] Moves sync between clients
- [ ] Chat messages work
- [ ] Game state is authoritative on server

### Authentication
- [ ] User can register
- [ ] User can sign in with correct password
- [ ] Sign in fails with wrong password
- [ ] User persists in MongoDB

### Matchmaking
- [ ] Player can join queue
- [ ] Two players are matched
- [ ] Game starts automatically after match
- [ ] ELO rating affects matching

---

## Debugging Tests

### Enable Verbose Output
```bash
npm test -- --verbose
```

### Run Single Test
```bash
npm test -- --testNamePattern="Valid pawn move succeeds"
```

### Debug in Chrome DevTools
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Open `chrome://inspect` and attach debugger.

### Print Debug Info
```javascript
test('debug test', () => {
  console.log('Game state:', game.board);
  expect(true).toBe(true);
});
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests fail locally but pass in CI | Check Node.js version: `npm test` vs CI uses v18 |
| MongoDB connection error in tests | CI uses Docker container; local tests need MongoDB running |
| Coverage below threshold | Add tests in `__tests__/` directory |
| GitHub Actions times out | Check for infinite loops or blocking operations |
| Tests hang | Use `--runInBand` flag to run sequentially |

---

## Best Practices

1. **Write tests early** – TDD approach catches bugs sooner
2. **Test edge cases** – Invalid moves, boundaries, out of bounds
3. **Mock external services** – Don't call real MongoDB in tests
4. **Keep tests fast** – Each test should run <100ms
5. **Use descriptive names** – `test('pawn cannot move backward')` not `test('move')`
6. **Test server logic** – Game logic should be testable without Socket.io
7. **Don't test libraries** – Assume Express, Socket.io work correctly
8. **Use beforeEach/afterEach** – Clean state between tests

---

## CI/CD Best Practices

1. **Fail fast** – Run quick tests before slow builds
2. **Automated rollback** – Deploy script can revert if tests fail
3. **Environment parity** – Test and prod should run same Node.js version
4. **Monitor deployments** – Set up alerts if deployment fails
5. **Keep logs** – GitHub Actions retains logs for 90 days
6. **Document secrets** – List required GitHub Secrets clearly

---

## Next Steps

1. Run tests locally: `npm test`
2. Enable GitHub Actions: Push `.github/workflows/ci-cd.yml` to repo
3. Add GitHub Secrets for deployment
4. Monitor first deployment in Actions tab
5. Integrate with Slack for notifications
6. Set up code coverage dashboard (Codecov)

Happy testing! 🧪
