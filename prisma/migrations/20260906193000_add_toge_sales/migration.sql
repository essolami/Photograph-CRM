CREATE TABLE "TogeSale" (
    "id" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "advance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TogeSale_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TogeSale_customerName_idx" ON "TogeSale"("customerName");
CREATE INDEX "TogeSale_createdAt_idx" ON "TogeSale"("createdAt");
