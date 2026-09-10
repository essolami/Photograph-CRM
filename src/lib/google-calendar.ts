import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const scopes = [
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
  "profile",
];
const redirectUri = () => {
  const configured = process.env.GOOGLE_REDIRECT_URI;
  if (configured && !(process.env.VERCEL && configured.includes("localhost")))
    return configured;
  if (process.env.VERCEL)
    return "https://photograph-crm.vercel.app/api/google/callback";
  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (productionHost)
    return `https://${productionHost.replace(/^https?:\/\//, "")}/api/google/callback`;
  return "http://localhost:3000/api/google/callback";
};

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
  });
  if (!client || !client.defenseDate) return false;
  const auth = googleOAuthClient();
  auth.setCredentials({ refresh_token: connection.refreshToken });
  const calendar = google.calendar({ version: "v3", auth });
  const date = client.defenseDate.toISOString().slice(0, 10);
  const [, month, day] = date.split("-");
  const time = client.defenseTime
    ? (() => {
        const [hours, minutes] = client.defenseTime.split(":");
        return `${Number(hours)}h${minutes === "00" ? "" : minutes}`;
      })()
    : null;
  const description = [
    client.name,
    `${day}/${month}${time ? ` à ${time}` : ""}`,
    client.facultyName,
    client.phone ? `Tel :${client.phone}` : "",
    client.packName,
    client.comment,
    `Total:${client.total.toString()}dhs`,
    `Avance:${client.advance.toString()}dhs`,
    `Reste:${client.total.minus(client.advance).toString()}dhs`,
  ]
    .filter(Boolean)
    .join("\n");
  const event = client.defenseTime
    ? (() => {
        // Google requires RFC3339 date-times. Keep the local Casablanca time
        // explicit instead of sending a timestamp without an offset.
        const startDate = new Date(`${date}T${client.defenseTime}:00+01:00`);
        const start = startDate.toISOString();
        const endDate = new Date(startDate);
        endDate.setUTCHours(endDate.getUTCHours() + 1);
        const end = endDate.toISOString();
        return {
          summary: client.name,
          description,
          start: { dateTime: start, timeZone: "Africa/Casablanca" },
          end: { dateTime: end, timeZone: "Africa/Casablanca" },
        };
      })()
    : {
        summary: client.name,
        description,
        start: { date },
        end: {
          date: new Date(client.defenseDate.getTime() + 86400000)
            .toISOString()
            .slice(0, 10),
        },
      };
  if (client.googleEventId) {
    try {
      await calendar.events.update({
        calendarId: connection.calendarId,
        eventId: client.googleEventId,
        requestBody: event,
        sendUpdates: "all",
      });
      return true;
    } catch (error) {
      const status = (error as { code?: number }).code;
      if (status !== 404) throw error;
      // The event may belong to a previous connected calendar. Create it again.
    }
  }
  {
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
