CREATE TYPE "DepositNetwork" AS ENUM ('ETH_ERC20', 'TRON_TRC20');
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "DepositRequest" (
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

CREATE UNIQUE INDEX "DepositRequest_txHash_key" ON "DepositRequest"("txHash");
CREATE INDEX "DepositRequest_userId_idx" ON "DepositRequest"("userId");
CREATE INDEX "DepositRequest_status_idx" ON "DepositRequest"("status");
CREATE INDEX "DepositRequest_txHash_idx" ON "DepositRequest"("txHash");

ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_walletId_fkey"
    FOREIGN KEY ("walletId") REFERENCES "VirtualWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
