# BlockCoin USDT Lab — Full Documentation

## Table of Contents

1. [What Is BlockCoin?](#1-what-is-blockcoin)
2. [How The System Works](#2-how-the-system-works)
3. [Architecture Overview](#3-architecture-overview)
4. [The Landing Page & Pricing Section](#4-the-landing-page--pricing-section)
5. [Internal Environment vs Testnet](#5-internal-environment-vs-testnet)
6. [User Features](#6-user-features)
7. [Admin Features](#7-admin-features)
8. [Security System](#8-security-system)
9. [Blockchain Integration](#9-blockchain-integration)
10. [How Money (Balances) Work](#10-how-money-balances-work)
11. [Frequently Asked Questions](#11-frequently-asked-questions)

---

## 1. What Is BlockCoin?

BlockCoin USDT Lab is a **private wallet simulation and security testing platform**.

It is NOT:
- A real cryptocurrency exchange
- A real USDT wallet holding real money
- A payment processor
- A money transmitter

It IS:
- A tool for developers and QA engineers to simulate USDT wallet behavior
- A security testing platform to find vulnerabilities before going live
- A demo environment for showing clients how a USDT wallet product works
- A testnet integration tool for interacting with real blockchain test networks (no real money)

Every balance shown inside the platform is **virtual** — numbers in a database. No real USDT is ever held, sent, or received through the internal system.

---

## 2. How The System Works

### The Big Picture

```
User Browser
     │
     ▼
  Nginx (blockcoin.beegoo.app)
     │
     ├──► Next.js Frontend (port 3005)   — the UI
     │
     └──► Express API (port 4000)        — the backend
               │
               ├──► PostgreSQL           — stores all data
               ├──► Redis                — job queue
               └──► BullMQ Worker        — processes simulations
```

### What Happens When a User Deposits

1. User clicks "Deposit" and enters an amount (e.g. 100 USDT)
2. Frontend sends `POST /api/v1/wallets/:id/deposit` to the API
3. API validates the request (auth, ownership, wallet status)
4. API calls the **Ledger Service** which:
   - Converts `100.000000` → `100000000n` (BigInt, 6 decimal places)
   - Opens a database transaction
   - Adds the amount to the LedgerAccount balance
   - Creates a LedgerEntry record (permanent, immutable)
   - Generates a unique idempotency key so the same deposit can never run twice
5. API creates a Transaction record
6. API emits a Socket.IO event → browser updates balance in real time
7. User sees new balance instantly

### What Happens When a Simulation Runs

1. Admin or user creates a simulation (e.g. "Credit 500 USDT in 10 seconds")
2. API creates a Simulation record with status `CREATED`
3. API enqueues a BullMQ job in Redis
4. BullMQ Worker picks up the job:
   - `CREATED` → `PENDING` → `PROCESSING` → `COMPLETED`
   - At `COMPLETED`, the ledger is updated atomically
   - Each status change creates a SimulationEvent record
5. If the job fails or crashes, the worker marks it `FAILED` automatically
6. If the simulation expires before completing, it becomes `EXPIRED`

---

## 3. Architecture Overview

### Apps

| App | Tech | Port | Purpose |
|-----|------|------|---------|
| `apps/web` | Next.js 14 | 3005 | User interface |
| `apps/api` | Express.js | 4000 | REST API + WebSocket |
| `apps/worker` | BullMQ | — | Background job processor |

### Packages (shared code)

| Package | Purpose |
|---------|---------|
| `packages/database` | Prisma schema + DB client |
| `packages/shared` | TypeScript types + USDT math utilities |
| `packages/validation` | Zod input validation schemas |

### Database Models

| Model | What It Stores |
|-------|---------------|
| `User` | Accounts, roles, passwords (Argon2id hashed) |
| `Session` | JWT refresh tokens |
| `VirtualWallet` | User wallets (label, status, address) |
| `LedgerAccount` | Current balance for each wallet |
| `LedgerEntry` | Every balance change — permanent record |
| `Transaction` | High-level transaction records |
| `Simulation` | Simulation jobs with state machine |
| `SimulationEvent` | Status transition history |
| `SimulationTemplate` | Reusable simulation presets |
| `TestnetTransaction` | Real blockchain transactions (testnet only) |
| `ApiKey` | API keys for programmatic access |
| `AdminLog` | Every admin action — audit trail |
| `SystemSetting` | Platform configuration (key/value) |
| `SecurityReport` | Results from security scenario runs |

---

## 4. The Landing Page & Pricing Section

### Why Is There a Pricing Section?

The landing page (`apps/web/app/page.tsx`) was built as a **marketing/demo page** — it presents BlockCoin as if it were a commercial SaaS product. This serves several purposes:

1. **Demo presentations** — If you're showing this platform to clients or investors, it looks like a real product with real pricing tiers
2. **Template for a real product** — If you ever want to turn this into a paid service, the pricing structure is already there
3. **Realistic UI** — Makes the platform look professional and production-ready

### The Pricing Plans (What They Mean)

The pricing on the landing page is **display only** — there is no payment system connected. All three plans link to the same `/register` page and create the same type of account.

| Plan | Displayed Price | What It Actually Does |
|------|----------------|----------------------|
| Starter | Free | Links to /register — creates a normal USER account |
| Pro | $29/month | Links to /register — creates the same USER account |
| Enterprise | Custom | Links to /register — creates the same USER account |

The feature limits shown (e.g. "3 wallets", "10 wallets") are **not enforced** by the current codebase. The actual limit is 10 wallets per user regardless of plan.

### How To Handle The Pricing Section

You have three options:

**Option A — Keep it as-is (demo/presentation tool)**
Leave the pricing as display-only. It makes the platform look like a real product. No payment processing needed.

**Option B — Remove the pricing section**
If you don't want to imply paid tiers, remove the `PLANS` array and the pricing `<section>` from `apps/web/app/page.tsx`.

**Option C — Connect real payments**
Integrate Stripe or another payment processor, enforce plan limits in the API based on the user's subscription tier stored in the database.

### Other Landing Page Sections Explained

| Section | What It Is |
|---------|-----------|
| Stats ("500+ Active Users") | Hardcoded display numbers — not pulled from the database |
| Testimonials | Fictional — Marcus T., Priya S., James K. are placeholder personas |
| "99.9% Uptime SLA" | Marketing copy — not a real SLA unless you set one up |
| Hero mockup (wallet UI) | Static HTML mockup — not connected to real data |

---

## 5. Internal Environment vs Testnet

This is the most important distinction in the entire platform.

### INTERNAL ENVIRONMENT

- Balances are numbers in PostgreSQL
- No blockchain involved whatsoever
- Transactions are instant (or delayed by simulation timer)
- No real money, no real USDT, no real addresses
- The "address" field on a wallet is a generated UUID-style identifier, not a real blockchain address
- Labeled with orange `INTERNAL ENVIRONMENT` badge throughout the UI

### TESTNET ENVIRONMENT

- Connected to real blockchain test networks
- Ethereum Sepolia — real transactions on Ethereum's test chain
- TRON Nile — real transactions on TRON's test chain
- Uses real wallet addresses and real private keys
- Transactions appear on public blockchain explorers
- Test tokens have NO real monetary value
- Labeled with blue `TESTNET ENVIRONMENT` badge throughout the UI

### Why They Are Kept Separate

- Internal transactions never have `txHash` or `blockNumber` fields
- Testnet transactions are stored in a completely separate `TestnetTransaction` table
- The API enforces this separation — you cannot mix internal and testnet operations
- This prevents any confusion between simulated balances and real blockchain activity

---

## 6. User Features

### Wallets
- Create up to 10 virtual wallets per account
- Each wallet has a label, status (ACTIVE/SUSPENDED), and its own ledger
- Real-time balance updates via WebSocket (Socket.IO)
- Full transaction history per wallet

### Transactions
- **Deposit** — Credit USDT to a wallet instantly
- **Withdraw** — Debit USDT from a wallet
- **Transfer** — Move USDT between two wallets atomically
- All amounts use 6 decimal precision (same as real USDT)

### Simulations
- Create a simulation with a delay (e.g. process in 30 seconds)
- Watch the status flow: `CREATED → PENDING → PROCESSING → COMPLETED`
- Cancel a simulation before it completes
- View full status timeline with timestamps

### Testnet (Blockchain)
- Connect to Ethereum Sepolia or TRON Nile
- Check any wallet's real testnet balance
- Submit real testnet transactions (requires a private key)
- Verify transactions on public explorers (Etherscan, Tronscan)

### Profile
- Update name and email
- Change password (requires current password)

---

## 7. Admin Features

Admins access everything at `/admin`. All admin routes require the `ADMIN` role.

### Dashboard
- Total users, wallets, transactions, simulations at a glance
- Recent activity feed

### User Management
- View all users
- Create new users (any role)
- Suspend / activate accounts
- Reset passwords
- View individual user details

### Wallet Management
- View all wallets across all users
- Adjust balances directly (admin deposit/withdraw)
- Suspend / activate wallets

### Transaction Management
- View all transactions platform-wide
- Filter by type, status, date
- View ledger entries

### Simulation Management
- View all simulations
- Create simulations on behalf of any user
- Force-change simulation status
- Cancel any simulation

### Templates
- Create reusable simulation templates
- Templates can be applied to create simulations quickly

### Security Simulator
- Run 10 security scenarios against the platform
- Results show PASS/FAIL per check
- Reports are saved and viewable historically

### Audit Logs
- Every admin action is logged permanently
- Actor, action, target, timestamp, metadata
- Cannot be deleted or modified

### Settings
- Update system settings (key/value store)
- Manage environment variables (RPC URLs, contract addresses)
- Toggle UI flags (show/hide environment badges, wallet notices)

---

## 8. Security System

The security simulator runs 10 scenarios across 8 categories:

| # | Scenario | What It Tests |
|---|----------|--------------|
| 1 | Balance Appearance | Virtual balance displays correctly |
| 2 | Pending Behavior | Pending transactions don't affect available balance |
| 3 | Idempotency | Same operation cannot be processed twice |
| 4 | Failure Isolation | Failed transactions don't affect balance |
| 5 | Expiry | Expired simulations don't credit/debit |
| 6 | Duplicate Detection | Duplicate requests are rejected |
| 7 | Amount Integrity | BigInt math prevents floating-point errors |
| 8 | Unverified Confirmation | Unconfirmed transactions aren't treated as complete |
| 9 | Cross-user Isolation | Users cannot access each other's wallets |
| 10 | Negative Amount | Negative amounts are rejected |

Each scenario produces a list of `CheckResult` items — each either `PASS` or `FAIL` with a description. Results are saved to the `SecurityReport` table.

---

## 9. Blockchain Integration

### Ethereum Sepolia
- RPC via `SEPOLIA_RPC_URL` (e.g. Infura, Alchemy, or public RPC)
- USDT contract: `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`
- Uses `ethers.js` v6
- Can read balances, submit transfers, verify receipts

### TRON Nile
- API via `TRON_NILE_URL` (TronGrid)
- USDT contract: `TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj`
- Uses `tronweb`
- Can read balances, submit transfers, verify receipts

### Private Key Handling
- Private keys are **never stored** in the database
- They are passed in the request body, used to sign the transaction, then discarded
- This is intentional — the platform is not a custodial wallet

### Token Verification
- The platform verifies the contract address matches the configured env var
- It does NOT assume a token is USDT just because its symbol says "USDT"
- This prevents spoofing with fake USDT contracts

---

## 10. How Money (Balances) Work

### BigInt Arithmetic

All balances are stored as `BigInt` with 6 decimal places.

```
1 USDT = 1,000,000 units
0.000001 USDT = 1 unit (minimum)
```

Example:
```
100.500000 USDT = 100500000n (stored in DB)
```

This is identical to how real USDT works on-chain. It completely eliminates floating-point errors like `0.1 + 0.2 = 0.30000000000000004`.

### Conversion Functions (packages/shared)

```typescript
unitsToDisplay(100500000n) // → "100.500000"
displayToUnits("100.5")    // → 100500000n
```

### Idempotency

Every ledger entry has a unique `idempotencyKey`. If the same key is submitted twice (e.g. due to a network retry), the second request returns the existing entry without creating a duplicate. This prevents double-crediting.

### Atomic Transactions

Transfers between wallets use Prisma's `$transaction()` — both the debit and credit happen in a single database transaction. If either fails, both are rolled back. It is impossible for money to leave one wallet without arriving in the other.

---

## 11. Frequently Asked Questions

**Q: Is any real money involved?**
A: No. All internal balances are virtual numbers in a database. The testnet integration uses test tokens with no monetary value.

**Q: Why does the landing page say "500+ Active Users"?**
A: That is hardcoded marketing copy for demo/presentation purposes. It is not pulled from the database.

**Q: Why is there a $29/month Pro plan if there's no payment system?**
A: The pricing section is a UI template for demo and presentation purposes. No payment is processed. All accounts are equal regardless of which plan button is clicked.

**Q: Can users see each other's wallets?**
A: No. Every wallet and transaction endpoint checks `wallet.userId === req.user.sub`. Users are strictly isolated.

**Q: What happens if the worker crashes mid-simulation?**
A: BullMQ's `worker.on('failed')` handler calls `failSimulation()` automatically. No simulation gets stuck in `PROCESSING` state after a crash.

**Q: Can the admin steal from user wallets?**
A: The admin can adjust balances (add or remove funds) for operational purposes. Every admin action is permanently recorded in the AdminLog with the actor's ID, timestamp, and metadata. Nothing is anonymous.

**Q: Are passwords stored in plain text?**
A: No. Passwords are hashed with Argon2id — the strongest password hashing algorithm currently available.

**Q: What is the INTERNAL ENVIRONMENT badge?**
A: A persistent UI label shown on every page that involves virtual balances. It reminds users that balances are simulated and not real USDT. It can be toggled on/off by an admin in Settings → UI Flags.
