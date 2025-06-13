-- CreateTable
CREATE TABLE "AllowedOrigin" (
    "id" SERIAL NOT NULL,
    "origin" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "addedById" UUID,

    CONSTRAINT "AllowedOrigin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowedOrigin_origin_key" ON "AllowedOrigin"("origin");

-- AddForeignKey
ALTER TABLE "AllowedOrigin" ADD CONSTRAINT "AllowedOrigin_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
