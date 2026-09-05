ALTER TABLE "Client" ADD COLUMN "advance" DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK ("advance" >= 0 AND "advance" <= "total");
