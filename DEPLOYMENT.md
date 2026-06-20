# Production Deployment Guide

This guide covers deploying the Digital Board Game Platform to production on multiple cloud platforms.

## Prerequisites

- **Git** repository initialized and pushed
- **Node.js 16+** and **npm**
- **MongoDB** instance (local or Atlas)
- Cloud account (Heroku, Railway, or similar)

---

## Option 1: Heroku Deployment (Easiest)

### 1. Install Heroku CLI
```bash
# Windows: download from https://devcenter.heroku.com/articles/heroku-cli
# Or use choco: choco install heroku-cli
```

### 2. Create Heroku App
```bash
heroku login
heroku create your-app-name
```

### 3. Add Environment Variables
```bash
heroku config:set MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/boardgame
heroku config:set JWT_SECRET=your-secret-key-here
heroku config:set NODE_ENV=production
heroku config:set PORT=5000
```

### 4. Deploy
```bash
git push heroku main
# Or if using different branch:
git push heroku your-branch:main
```

### 5. View Logs
```bash
heroku logs --tail
heroku open  # Opens your app in browser
```

---

## Option 2: Railway Deployment

### 1. Sign Up
Go to https://railway.app and sign up with GitHub

### 2. Create New Project
- Connect your GitHub repo
- Select the repo
- Railway auto-detects Node.js

### 3. Add MongoDB
- In Railway dashboard, click **+ New**
- Select **Database** → **MongoDB**
- Provision a MongoDB instance

### 4. Configure Environment
- In **Variables** tab, add:
  ```
  NODE_ENV=production
  MONGO_URI=<Railway MongoDB connection string>
  JWT_SECRET=your-secret-here
  PORT=3000
  ```

### 5. Deploy
- Railway auto-deploys on push to main
- View logs in Railway dashboard

---

## Option 3: Self-Hosted (VPS)

### 1. SSH into VPS
```bash
ssh user@your-vps-ip
```

### 2. Install Dependencies
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs mongodb-org
```

### 3. Clone Repository
```bash
cd /var/www
git clone https://github.com/your-repo/boardgame-platform.git
cd boardgame-platform
npm install
```

### 4. Setup MongoDB
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 5. Configure Systemd Service
Create `/etc/systemd/system/boardgame.service`:
```ini
[Unit]
Description=Digital Board Game Platform
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/boardgame-platform
ExecStart=/usr/bin/node backend/server.js
Restart=on-failure
RestartSec=10
Environment="NODE_ENV=production"
Environment="MONGO_URI=mongodb://localhost:27017/boardgame"
Environment="JWT_SECRET=your-secret-here"
Environment="PORT=4000"

[Install]
WantedBy=multi-user.target
```

### 6. Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl start boardgame
sudo systemctl enable boardgame
sudo systemctl status boardgame
```

### 7. Setup Nginx Reverse Proxy
Create `/etc/nginx/sites-available/boardgame`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 8. Enable and Test
```bash
sudo ln -s /etc/nginx/sites-available/boardgame /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Setup SSL (Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## MongoDB Atlas Setup (Cloud MongoDB)

### 1. Create Account
Go to https://www.mongodb.com/cloud/atlas and sign up

### 2. Create Cluster
- Click **Create** → **Create Cluster**
- Choose free tier (M0)
- Select region closest to your app
- Wait for cluster to be ready

### 3. Create Database User
- Go to **Database Access**
- Click **+ Add New Database User**
- Enter username and password
- Add privileges for `boardgame` database

### 4. Whitelist IPs
- Go to **Network Access**
- Click **+ Add IP Address**
- For production: add your VPS/server IP
- For development: add `0.0.0.0/0` (your IP only, never in production!)

### 5. Get Connection String
- Click **Connect** on your cluster
- Select **Connect your application**
- Copy MongoDB URI
- Replace `<username>`, `<password>`, and `<database>` with your values

Example:
```
mongodb+srv://user:password@cluster.mongodb.net/boardgame?retryWrites=true&w=majority
```

---

## Environment Variables (Production)

Create `.env` file (never commit this):
```env
# Required
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/boardgame
JWT_SECRET=generate-a-random-secret-with-32-characters-minimum
NODE_ENV=production
PORT=4000

# Optional
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
REDIS_URL=redis://...  # If using Redis for caching
```

**Generate secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Performance Optimization

### 1. Enable Compression
Already enabled via Express middleware in `server.js`

### 2. Use Redis for Caching (Optional)
```bash
npm install redis
```

Update `server.js`:
```javascript
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });
```

### 3. Clustering (Node.js)
Update `server.js` to use `cluster` module for multi-core CPU usage

### 4. Database Indexing
MongoDB indexes for faster queries:
```javascript
// In User model
userSchema.index({ username: 1 });
userSchema.index({ elo: -1 });
```

### 5. Game State Cleanup
Add periodic cleanup of old games:
```javascript
setInterval(() => {
  const now = Date.now();
  for (const gameId in games) {
    if (now - games[gameId].createdAt > 24 * 60 * 60 * 1000) {
      delete games[gameId];
    }
  }
}, 60 * 60 * 1000); // Every hour
```

---

## Monitoring & Logging

### 1. PM2 Process Manager (Self-Hosted)
```bash
npm install -g pm2
pm2 start backend/server.js --name boardgame
pm2 save
pm2 startup
```

View logs:
```bash
pm2 logs boardgame
pm2 monit
```

### 2. Application Logging
```javascript
// In server.js
const fs = require('fs');
const logStream = fs.createWriteStream('app.log', { flags: 'a' });

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});
```

### 3. Error Tracking (Sentry)
```bash
npm install @sentry/node
```

---

## Database Backups

### MongoDB Atlas (Automatic)
- Automatic daily backups included in free tier
- Manual backup via Atlas dashboard

### Self-Hosted MongoDB
```bash
# Backup
mongodump --out /backups/$(date +%Y%m%d)

# Restore
mongorestore /backups/20240618
```

---

## Continuous Deployment (CI/CD)

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      - run: cd backend && npm install && npm test
      - run: git push https://heroku.git main
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
```

---

## Testing Before Deployment

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Test production build locally
NODE_ENV=production npm start
```

---

## Health Checks

Add a health check endpoint (already in `server.js`):
```
GET /api/health
Response: { "status": "ok" }
```

Most platforms support health checks to restart failed instances.

---

## Scaling

### Horizontal Scaling (Multiple Instances)
- Use **Load Balancer** (Nginx, HAProxy, or cloud native)
- Use **Redis** for session sharing
- Use **MongoDB** as single source of truth (no local state)

### Vertical Scaling (Single Instance)
- Increase server memory/CPU
- Optimize database queries
- Enable caching

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `MONGO_URI not found` | Add env vars to platform (Heroku config, Railway vars, etc) |
| `Port already in use` | Change `PORT` env var or kill process: `lsof -i :4000` |
| `Socket.io not connecting` | Ensure CORS is configured and frontend connects to correct server URL |
| `High latency` | Check network, consider CDN, optimize game logic |
| `Memory leak` | Profile with `node --inspect server.js` and use Chrome DevTools |

---

## Support & Next Steps

For more help:
1. Check logs: `npm run dev` locally with `NODE_ENV=development`
2. Test API: Postman collection in `/docs`
3. Monitor: Use platform-native dashboards
4. Scale: Add caching or split into microservices

**Ready to deploy?** Choose one platform above and follow the steps! 🚀
