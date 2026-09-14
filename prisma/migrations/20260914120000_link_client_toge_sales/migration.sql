ALTER TABLE "TogeSale" ADD COLUMN "clientId" INTEGER;

CREATE UNIQUE INDEX "TogeSale_clientId_key" ON "TogeSale"("clientId");

ALTER TABLE "TogeSale" ADD CONSTRAINT "TogeSale_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
