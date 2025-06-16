/*
  Warnings:

  - Added the required column `mobile` to the `wait_list_signup` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "wait_list_signup" ADD COLUMN     "mobile" TEXT NOT NULL;
