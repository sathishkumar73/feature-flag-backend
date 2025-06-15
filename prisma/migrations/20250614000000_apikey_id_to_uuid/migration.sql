-- Migration: Change ApiKey.id from Int to UUID
-- 1. Add a new UUID column
ALTER TABLE "ApiKey" ADD COLUMN "id_new" UUID DEFAULT gen_random_uuid();

-- 2. Copy id values (if you want to keep a reference, or just use the new UUIDs)
-- (Optional: You can skip this if you don't need to preserve the old int id)

-- 3. Set new UUID as primary key
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_pkey";
ALTER TABLE "ApiKey" ADD PRIMARY KEY ("id_new");

-- 4. Drop the old id column
ALTER TABLE "ApiKey" DROP COLUMN "id";

-- 5. Rename id_new to id
ALTER TABLE "ApiKey" RENAME COLUMN "id_new" TO "id";

-- 6. Update all foreign keys or references to ApiKey.id in other tables (if any)
-- (You may need to update your code and DTOs to expect a string UUID for id)

-- 7. (Optional) Recreate indexes if needed
