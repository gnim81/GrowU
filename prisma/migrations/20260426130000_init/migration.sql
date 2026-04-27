CREATE TYPE "PointTransactionType" AS ENUM ('BONUS', 'PENALTY', 'REWARD');

CREATE TABLE "Child" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "displayColor" TEXT NOT NULL DEFAULT '#2563EB',
  "avatarText" TEXT NOT NULL DEFAULT '',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PointItem" (
  "id" TEXT NOT NULL,
  "type" "PointTransactionType" NOT NULL,
  "name" TEXT NOT NULL,
  "defaultPoints" INTEGER NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PointItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PointTransaction" (
  "id" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "type" "PointTransactionType" NOT NULL,
  "itemId" TEXT,
  "itemNameSnapshot" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "createdByUsername" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TransactionRevision" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "beforeData" JSONB NOT NULL,
  "afterData" JSONB NOT NULL,
  "reason" TEXT NOT NULL,
  "editedByUsername" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TransactionRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PointItem_type_enabled_sortOrder_idx" ON "PointItem"("type", "enabled", "sortOrder");
CREATE INDEX "PointTransaction_childId_occurredAt_idx" ON "PointTransaction"("childId", "occurredAt");
CREATE INDEX "PointTransaction_type_occurredAt_idx" ON "PointTransaction"("type", "occurredAt");
CREATE INDEX "TransactionRevision_transactionId_createdAt_idx" ON "TransactionRevision"("transactionId", "createdAt");

ALTER TABLE "PointTransaction"
  ADD CONSTRAINT "PointTransaction_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PointTransaction"
  ADD CONSTRAINT "PointTransaction_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "PointItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TransactionRevision"
  ADD CONSTRAINT "TransactionRevision_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "PointTransaction"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
