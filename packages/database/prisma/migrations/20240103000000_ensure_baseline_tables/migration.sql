-- Ensure Role enum has all values
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUB_ADMIN'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')) THEN
    ALTER TYPE "Role" ADD VALUE 'SUB_ADMIN';
  END IF;
END $$;

-- Ensure PermissionLevel enum exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PermissionLevel') THEN
    CREATE TYPE "PermissionLevel" AS ENUM ('READ', 'WRITE');
  END IF;
END $$;

-- Ensure SubAdminPermission table exists
CREATE TABLE IF NOT EXISTS "SubAdminPermission" (
    "id"      TEXT NOT NULL,
    "userId"  TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "level"   "PermissionLevel" NOT NULL,

    CONSTRAINT "SubAdminPermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SubAdminPermission_userId_feature_key"
  ON "SubAdminPermission"("userId", "feature");

CREATE INDEX IF NOT EXISTS "SubAdminPermission_userId_idx"
  ON "SubAdminPermission"("userId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'SubAdminPermission_userId_fkey'
  ) THEN
    ALTER TABLE "SubAdminPermission"
      ADD CONSTRAINT "SubAdminPermission_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Ensure SystemSetting table exists
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "key"       TEXT NOT NULL,
    "value"     TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);
