-- CreateTable
CREATE TABLE "beta_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "userId" UUID,
    "first_login_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "invite_token" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beta_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beta_users_email_key" ON "beta_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "beta_users_userId_key" ON "beta_users"("userId");

-- AddForeignKey
ALTER TABLE "beta_users" ADD CONSTRAINT "beta_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
