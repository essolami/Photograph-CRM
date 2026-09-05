UPDATE "Supplement" SET "name" = 'Perso toge', "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'Toge personnalisée' AND NOT EXISTS (SELECT 1 FROM "Supplement" WHERE "name" = 'Perso toge');
INSERT INTO "Supplement" ("name", "price", "isActive", "updatedAt") VALUES
('Toge', 400, true, CURRENT_TIMESTAMP),
('Perso toge', 30, true, CURRENT_TIMESTAMP),
('Tableau', 400, true, CURRENT_TIMESTAMP),
('Miroir', 400, true, CURRENT_TIMESTAMP),
('Album', 600, true, CURRENT_TIMESTAMP),
('Photobook', 1200, true, CURRENT_TIMESTAMP),
('Déco', 1200, true, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO UPDATE SET "price" = EXCLUDED."price", "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP;
