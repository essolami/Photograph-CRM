CREATE TABLE "FacultyPackRate" (
 "id" SERIAL PRIMARY KEY,
 "facultyId" INTEGER NOT NULL REFERENCES "Faculty"("id") ON DELETE CASCADE,
 "packId" INTEGER NOT NULL REFERENCES "Pack"("id") ON DELETE CASCADE,
 "soloPrice" DECIMAL(10,2) NOT NULL CHECK ("soloPrice" >= 0),
 "duoPrice" DECIMAL(10,2) NOT NULL CHECK ("duoPrice" >= 0),
 UNIQUE ("facultyId", "packId")
);
