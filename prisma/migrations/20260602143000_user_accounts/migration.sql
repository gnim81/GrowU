CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PARENT');

CREATE TABLE "UserAccount" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'PARENT',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserAccount_username_key" ON "UserAccount"("username");
