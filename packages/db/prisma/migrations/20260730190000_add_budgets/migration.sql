-- Budget: selectable budget/plan options for the public contact form. Managed in the CMS.
CREATE TABLE "Budget" (
    "id" UUID NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelAr" TEXT,
    "amount" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Budget_order_idx" ON "Budget"("order");

-- CreateIndex
CREATE INDEX "Budget_active_idx" ON "Budget"("active");

-- Message: which budget the enquirer selected (free-text snapshot, survives Budget deletion).
ALTER TABLE "Message" ADD COLUMN "budget" TEXT;
