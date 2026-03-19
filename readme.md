# Fullstack Deployment Documentation

## Stack

| Layer           | Technology                          |
| --------------- | ----------------------------------- |
| Hardware        | Raspberry Pi Zero 2W                |
| OS              | Raspberry Pi OS (Debian)            |
| Backend         | Node.js 22 + TypeScript             |
| Frontend        | React (Vite)                        |
| Web Server      | Nginx                               |
| Process Manager | systemd                             |
| CI/CD           | GitHub Actions (self-hosted runner) |

---

## Directory Structure on Pi

```
/home/aditya/apps/fullstack-app/
├── server/          # Deployed backend (compiled TS + node_modules)
│   ├── dist/        # Compiled TypeScript output
│   ├── node_modules/
│   └── server.log   # stdout + stderr from Node process
└── client/          # Built React static files
    ├── index.html
    └── assets/
```

---

## Systemd Service

**File:** `/etc/systemd/system/app.service`

```ini
[Unit]
Description=App server
After=network.target

[Service]
Type=simple
User=aditya
WorkingDirectory=/home/aditya/apps/fullstack-app/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
StandardOutput=append:/home/aditya/apps/fullstack-app/server/server.log
StandardError=append:/home/aditya/apps/fullstack-app/server/server.log

[Install]
WantedBy=multi-user.target
```

**Apply changes after editing:**

```bash
sudo systemctl daemon-reload
sudo systemctl restart app
```

---

## Nginx Config

**File:** `/etc/nginx/sites-enabled/app`

> ⚠️ This file is loaded directly by nginx (confirmed via `sudo nginx -T`). Do not edit `sites-available/default` — it is not used.

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location /api/ {
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /home/aditya/apps/fullstack-app/client;
        try_files $uri $uri/ /index.html;
    }
}
```

> The `rewrite` rule strips `/api/` before forwarding to the backend, so a request to `/api/auth/login` reaches the backend as `/auth/login`.
> `127.0.0.1` is used instead of `localhost` to avoid IPv6 resolution issues on the Pi.

**Edit and reload:**

```bash
sudo nano /etc/nginx/sites-enabled/app
sudo nginx -t && sudo systemctl reload nginx
```

**Verify which config files nginx is loading:**

```bash
sudo nginx -T | grep "# configuration file"
```

---

## Sudoers Rules

**File:** `/etc/sudoers` (edit via `sudo visudo`)

```
aditya ALL=(ALL) NOPASSWD: /bin/systemctl restart app, /bin/systemctl reload nginx
```

---

## File Permissions

Nginx runs as `www-data` and needs read access to the client dist folder:

```bash
chmod 755 /home/aditya
chmod -R 755 /home/aditya/apps/fullstack-app/client
```

---

## CI/CD Workflows

### `.github/workflows/backend.yml`

Triggers on changes to `server/**`

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths:
      - "server/**"

jobs:
  deploy-backend:
    runs-on: self-hosted
    timeout-minutes: 15
    environment: secrets

    defaults:
      run:
        working-directory: server

    env:
      NODE_OPTIONS: "--max-old-space-size=256"

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: server/package-lock.json

      - name: Configure npm for low memory
        run: |
          npm config set maxsockets 1
          npm config set audit false
          npm config set fund false
          npm config set progress false

      - name: Install dependencies
        run: npm ci

      - name: Setup env
        run: |
          echo "DATABASE_URL=${{ secrets.DATABASE_URL }}" >> .env
          echo "DIRECT_URL=${{ secrets.DIRECT_URL }}" >> .env
          echo "ACCESS_TOKEN_SECRET=${{ secrets.ACCESS_TOKEN_SECRET }}" >> .env
          echo "REFRESH_TOKEN_SECRET=${{ secrets.REFRESH_TOKEN_SECRET }}" >> .env

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run tests
        run: npm test

      - name: Build TypeScript
        run: npm run build

      - name: Remove dev dependencies
        run: npm prune --omit=dev

      - name: Deploy backend
        run: rsync -av --delete ${{ github.workspace }}/server/ $HOME/apps/fullstack-app/server/

      - name: Restart backend service
        run: sudo systemctl restart app
```

### `.github/workflows/frontend.yml`

Triggers on changes to `client/**`

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths:
      - "client/**"

jobs:
  deploy-frontend:
    runs-on: self-hosted

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Prepare directories
        run: mkdir -p $HOME/apps/fullstack-app/client

      - name: Install frontend dependencies
        working-directory: client
        run: npm install

      - name: Build frontend
        working-directory: client
        run: npm run build

      - name: Deploy frontend
        run: rsync -av --delete client/dist/ $HOME/apps/fullstack-app/client/

      - name: Reload nginx
        run: sudo systemctl reload nginx
```

---

## Request Routing

```
External Request (port 80)
        │
        ▼
      Nginx
        │
        ├── /api/*  ──▶  rewrite strips /api/  ──▶  localhost:3000  (Node.js)
        │
        └── /*      ──▶  /home/aditya/apps/fullstack-app/client  (static files)
```

Port 3000 is internal only — never accessed directly.

**Frontend API calls must use relative paths:**

```javascript
// correct
fetch("/api/users");

// wrong
fetch("http://localhost:3000/api/users");
```

**Vite dev proxy** (`vite.config.js`):

```javascript
export default {
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
};
```

---

## Access

| What        | URL                          |
| ----------- | ---------------------------- |
| Frontend    | `http://<pi-ip>/`            |
| Backend API | `http://<pi-ip>/api/<route>` |

Find Pi IP: `hostname -I`

---

## Debugging Commands

### systemd

```bash
# service status
sudo systemctl status app

# last 50 log lines
sudo journalctl -u app -n 50 --no-pager

# follow live logs
sudo journalctl -u app -f

# restart service
sudo systemctl restart app

# check if enabled on boot
sudo systemctl is-enabled app
```

### Application Logs

```bash
# tail server log
tail -f /home/aditya/apps/fullstack-app/server/server.log

# last 100 lines
tail -n 100 /home/aditya/apps/fullstack-app/server/server.log
```

### Nginx

```bash
# validate config syntax
sudo nginx -t

# reload config (no downtime)
sudo systemctl reload nginx

# full restart
sudo systemctl restart nginx

# nginx status
sudo systemctl status nginx

# show all active config files nginx is loading
sudo nginx -T | grep "# configuration file"

# show active config for a specific block
sudo nginx -T | grep -A 20 "location /api"

# nginx error log
sudo tail -f /var/log/nginx/error.log

# nginx access log
sudo tail -f /var/log/nginx/access.log
```

### Network

```bash
# check what's listening on port 3000
ss -tlnp | grep 3000

# check what's listening on port 80
ss -tlnp | grep 80

# test backend directly (bypasses nginx)
curl http://127.0.0.1:3000/<route>

# test via nginx (goes through proxy)
curl http://localhost/api/<route>
```

### Deployed Files

```bash
# check backend files exist
ls -la /home/aditya/apps/fullstack-app/server/dist/

# check frontend files exist
ls -la /home/aditya/apps/fullstack-app/client/

# check file permissions
ls -la /home/aditya/apps/fullstack-app/client/index.html
```

### GitHub Actions Runner

```bash
# runner status
sudo systemctl status actions.runner.*

# runner logs
sudo journalctl -u actions.runner.* -n 50 --no-pager
```
