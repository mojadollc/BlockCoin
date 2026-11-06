DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DepositNetwork') THEN
    CREATE TYPE "DepositNetwork" AS ENUM ('ETH_ERC20', 'TRON_TRC20');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DepositStatus') THEN
    CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "DepositRequest" (
    "id"            TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "walletId"      TEXT NOT NULL,
    "network"       "DepositNetwork" NOT NULL,
    "txHash"        TEXT NOT NULL,
    "amountDisplay" TEXT NOT NULL,
    "status"        "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote"     TEXT,
    "reviewedBy"    TEXT,
    "reviewedAt"    TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DepositRequest_txHash_key" ON "DepositRequest"("txHash");
CREATE INDEX IF NOT EXISTS "DepositRequest_userId_idx" ON "DepositRequest"("userId");
CREATE INDEX IF NOT EXISTS "DepositRequest_status_idx" ON "DepositRequest"("status");
CREATE INDEX IF NOT EXISTS "DepositRequest_txHash_idx" ON "DepositRequest"("txHash");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'DepositRequest_userId_fkey'
  ) THEN
    ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'DepositRequest_walletId_fkey'
  ) THEN
    ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_walletId_fkey"
      FOREIGN KEY ("walletId") REFERENCES "VirtualWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
