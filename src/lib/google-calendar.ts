import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const scopes = [
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
  "profile",
];
const redirectUri = () =>
  process.env.GOOGLE_REDIRECT_URI ??
  "http://localhost:3000/api/google/callback";

export function googleOAuthClient() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    throw new Error("Google Calendar OAuth n’est pas configuré.");
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri(),
  );
}

export function googleAuthorizationUrl(state: string) {
  return googleOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: scopes,
    state,
  });
}

export async function syncClientCalendar(clientId: number) {
  const connection = await prisma.googleCalendarConnection.findFirst();
  if (!connection) return false;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { photographer: true, editor: true },
  });
  if (!client || !client.defenseDate) return false;
  const auth = googleOAuthClient();
  auth.setCredentials({ refresh_token: connection.refreshToken });
  const calendar = google.calendar({ version: "v3", auth });
  const supplements = Array.isArray(client.supplements)
    ? (client.supplements as { name: string }[])
        .map((item) => item.name)
        .join(", ")
    : "Aucun";
  const description = [
    `Client : ${client.name}`,
    `Téléphone : ${client.phone || "Non renseigné"}`,
    `Pack : ${client.packName || "Non renseigné"}`,
    `Faculté : ${client.facultyName || "Non renseignée"}`,
    `Format : ${client.isDuo ? "Binôme" : "Solo"}`,
    `Suppléments : ${supplements}`,
    `Photographe : ${client.photographer?.name || "Non affecté"}`,
    `Monteur : ${client.editor?.name || "Non affecté"}`,
    `Statut : ${client.status}`,
    client.comment ? `Commentaire : ${client.comment}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const event = {
    summary: `Soutenance — ${client.name}`,
    description,
    start: { date: client.defenseDate.toISOString().slice(0, 10) },
    end: {
      date: new Date(client.defenseDate.getTime() + 86400000)
        .toISOString()
        .slice(0, 10),
    },
  };
  if (client.googleEventId)
    await calendar.events.update({
      calendarId: connection.calendarId,
      eventId: client.googleEventId,
      requestBody: event,
      sendUpdates: "all",
    });
  else {
    const created = await calendar.events.insert({
      calendarId: connection.calendarId,
      requestBody: event,
      sendUpdates: "all",
    });
    if (created.data.id)
      await prisma.client.update({
        where: { id: client.id },
        data: { googleEventId: created.data.id },
      });
  }
  return true;
}
