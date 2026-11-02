# BlockCoin USDT Lab

Private Wallet Simulation & Security Testing Platform.

> ⚠️ **INTERNAL ENVIRONMENT** — All balances are virtual. No real assets.

## Architecture

```
apps/
  web/      Next.js 14 frontend (port 3000)
  api/      Express API (port 4000)
  worker/   BullMQ background worker
packages/
  database/ Prisma schema + client
  shared/   TypeScript types + utilities
  validation/ Zod schemas
infrastructure/
  docker-compose.yml      PostgreSQL + Redis (internal network only)
  nginx.conf              Reverse proxy config
  ecosystem.config.yml    PM2 process config
  scripts/
    deploy.sh             VPS deployment
    backup.sh             PostgreSQL backup (cron-ready)
    restore.sh            Restore from backup
    healthcheck.sh        Service health verification
tests/
  api/          Auth, wallet, permission API tests
  integration/  Ledger integrity tests
  security/     Security & isolation tests
  unit/         Shared utility unit tests
  setup/        Jest helpers and fixtures
```

## Quick Start

### 1. Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7
- Docker (optional, for infra)

### 2. Setup

```bash
# Copy env
cp .env.example .env
# Edit .env with your DB/Redis credentials

# Start infra (Docker)
cd infrastructure && docker compose up -d

# Install dependencies
npm install

# Generate Prisma client
cd packages/database && npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed admin user
npx ts-node prisma/seed.ts
```

### 3. Development

```bash
# Terminal 1 — API
cd apps/api && npm run dev

# Terminal 2 — Web
cd apps/web && npm run dev

# Terminal 3 — Worker
cd apps/worker && npm run dev
```

### 4. Testing

```bash
# All tests
npm test

# By suite
npm run test:unit
npm run test:api
npm run test:integration
npm run test:security
```

### 5. Production (VPS)

```bash
# Deploy
REPO_URL=https://github.com/your/repo bash infrastructure/scripts/deploy.sh

# Enable HTTPS
certbot --nginx -d your-domain.com

# Health check
bash infrastructure/scripts/healthcheck.sh

# Backup (add to cron)
bash infrastructure/scripts/backup.sh
```

## Build Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Complete | Foundation — monorepo, auth, DB schema |
| 2 | ✅ Complete | Admin Portal |
| 3 | ✅ Complete | Virtual Wallet & Ledger |
| 4 | ✅ Complete | Simulation Engine |
| 5 | ✅ Complete | Security Simulator |
| 6 | ✅ Complete | Testnet Integration |
| 7 | ✅ Complete | Testing & Deployment |

## Environment Labels

- `INTERNAL ENVIRONMENT` — Virtual wallets and simulated transactions
- `TESTNET ENVIRONMENT` — Real testnet blockchain operations

These labels are displayed persistently throughout the UI.

## Default Admin

After seeding:
- Email: `admin@blockcoin.lab`
- Password: `Admin@BlockCoin2024!`

Change immediately after first login.

## Testnet Configuration

Add to `.env`:

```env
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_USDT_CONTRACT=0x7169D38820dfd117C3FA1f22a697dBA58d90BA06

TRON_NILE_URL=https://nile.trongrid.io
TRON_NILE_API_KEY=your-trongrid-api-key
TRON_NILE_USDT_CONTRACT=TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj
```
