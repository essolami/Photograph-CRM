ALTER TABLE "Editor" ADD COLUMN IF NOT EXISTS "phone" TEXT;

CREATE TABLE "EditorTask" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Pas commencée',
  "dueDate" DATE,
  "editorId" INTEGER NOT NULL,
  "clientId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EditorTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EditorTask_editorId_status_idx" ON "EditorTask"("editorId", "status");
CREATE INDEX "EditorTask_clientId_idx" ON "EditorTask"("clientId");
ALTER TABLE "EditorTask" ADD CONSTRAINT "EditorTask_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "Editor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EditorTask" ADD CONSTRAINT "EditorTask_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
