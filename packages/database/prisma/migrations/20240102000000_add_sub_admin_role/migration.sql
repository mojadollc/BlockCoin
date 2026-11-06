-- Add SUB_ADMIN to the Role enum if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'SUB_ADMIN'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'SUB_ADMIN';
  END IF;
END
$$;
