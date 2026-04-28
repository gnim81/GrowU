ALTER TABLE "PointItem"
ADD COLUMN "childId" TEXT;

DROP INDEX IF EXISTS "PointItem_type_enabled_sortOrder_idx";

CREATE INDEX "PointItem_type_enabled_childId_sortOrder_idx"
ON "PointItem"("type", "enabled", "childId", "sortOrder");
