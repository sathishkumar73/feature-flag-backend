-- CreateEnum
CREATE TYPE "WaitListStatus" AS ENUM ('APPROVED', 'PENDING', 'REVOKED');

-- AlterTable
ALTER TABLE "wait_list_signup" ADD COLUMN     "status" "WaitListStatus" NOT NULL DEFAULT 'PENDING';
