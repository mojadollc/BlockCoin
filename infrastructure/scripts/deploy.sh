#!/usr/bin/env bash
# deploy.sh — BlockCoin USDT Lab VPS deployment
# Run as: bash infrastructure/scripts/deploy.sh
set -euo pipefail

APP_DIR="/opt/blockcoin"
REPO_URL="${REPO_URL:-}"
NODE_VERSION="20"

echo "==> BlockCoin USDT Lab — Deployment Script"
echo "==> Target: $APP_DIR"

# ── 1. System dependencies ────────────────────────────────────────────────────
echo "==> Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw

# Node.js via nvm
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi

# PM2
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

echo "==> Node $(node -v), npm $(npm -v), PM2 $(pm2 -v)"

# ── 2. Firewall ───────────────────────────────────────────────────────────────
echo "==> Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
# PostgreSQL and Redis are NOT opened — internal only
ufw --force enable

# ── 3. Application directory ──────────────────────────────────────────────────
echo "==> Setting up application directory..."
mkdir -p "$APP_DIR"

if [ -n "$REPO_URL" ]; then
  if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR" && git pull
  else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
  fi
else
  echo "==> REPO_URL not set — assuming code already in $APP_DIR"
  cd "$APP_DIR"
fi

# ── 4. Environment ────────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  echo "==> ERROR: .env file not found at $APP_DIR/.env"
  echo "==> Copy .env.example to .env and fill in all values before deploying."
  exit 1
fi

# ── 5. Install & build ────────────────────────────────────────────────────────
echo "==> Installing dependencies..."
npm install --production=false

echo "==> Generating Prisma client..."
cd packages/database && npx prisma generate && cd ../..

echo "==> Running database migrations..."
cd packages/database && npx prisma migrate deploy && cd ../..

echo "==> Building all apps..."
npm run build

# ── 6. PM2 ───────────────────────────────────────────────────────────────────
echo "==> Starting/restarting PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 start infrastructure/ecosystem.config.yml
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

echo "==> PM2 status:"
pm2 list

# ── 7. Nginx ──────────────────────────────────────────────────────────────────
echo "==> Configuring Nginx..."
cp infrastructure/nginx.conf /etc/nginx/sites-available/blockcoin
ln -sf /etc/nginx/sites-available/blockcoin /etc/nginx/sites-enabled/blockcoin
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "==> Deployment complete!"
echo "==> Next: run certbot --nginx -d your-domain.com to enable HTTPS"
