#!/bin/bash

# -----------------------------------------
# 🔁 scripts/deploy.sh — PM2 Deployment Script
# -----------------------------------------

USER="ubuntu"                                 # SSH user
HOST="your.server.ip.address"                # Remote server IP
APP_DIR="/home/ubuntu/app"                   # Remote app path
ENV_FILE=".env.production"                   # Local env file to copy
SSH_KEY="$HOME/.ssh/github_ci_rsa"          # Private SSH key path

# BUILD LOCALLY
echo "📦 Building Docker image locally..."
docker build -t fp-middleware-api .

# COPY TO SERVER
echo "🚀 Copying source and env file to server..."
scp -i "$SSH_KEY" -r . "$USER@$HOST:$APP_DIR"
scp -i "$SSH_KEY" "$ENV_FILE" "$USER@$HOST:$APP_DIR/.env"

# EXECUTE REMOTE COMMANDS
ssh -i "$SSH_KEY" "$USER@$HOST" << EOF
  cd "$APP_DIR"
  echo "🔁 Restarting app using PM2..."
  pm2 startOrReload ecosystem.config.js --env production
EOF

echo "✅ Deployment successful via PM2."

# -----------------------------------------
# USAGE:
# 1. Save this file as scripts/deploy.sh
# 2. Make executable: chmod +x scripts/deploy.sh
# 3. Run locally or via CI: ./scripts/deploy.sh
