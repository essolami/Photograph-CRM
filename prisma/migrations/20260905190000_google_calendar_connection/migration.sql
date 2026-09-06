CREATE TABLE "GoogleCalendarConnection" (
  "id" SERIAL NOT NULL,
  "email" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "calendarId" TEXT NOT NULL DEFAULT 'primary',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoogleCalendarConnection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GoogleCalendarConnection_email_key" ON "GoogleCalendarConnection"("email");
