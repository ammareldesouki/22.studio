-- Manual ordering for projects (drives the homepage "Selected work" order and the work list).
ALTER TABLE "Project" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Project_order_idx" ON "Project"("order");
