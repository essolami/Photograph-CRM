import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { googleOAuthClient } from "@/lib/google-calendar";
import { syncClientCalendar } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const store = await cookies();
  if (!state || state !== store.get("google_calendar_state")?.value || !code)
    redirect("/parametres/packs?calendar=error");
  let email = "";
  try {
    const auth = googleOAuthClient();
    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);
    const oauth = googleOAuthClient();
    oauth.setCredentials(tokens);
    const oauth2 = (await import("googleapis")).google.oauth2({
      version: "v2",
      auth: oauth,
    });
    const profile = await oauth2.userinfo.get();
    email = profile.data.email ?? "";
    if (!email) throw new Error("Compte Google sans adresse e-mail.");
    const previous = await prisma.googleCalendarConnection.findUnique({
      where: { email },
    });
    const refreshToken = tokens.refresh_token ?? previous?.refreshToken;
    if (!refreshToken)
      throw new Error(
        "Aucun refresh token. Révoquez l’accès Google puis reconnectez le compte.",
      );
    await prisma.googleCalendarConnection.upsert({
      where: { email },
      update: { refreshToken },
      create: { email, refreshToken },
    });
    const existingClients = await prisma.client.findMany({
      where: { defenseDate: { not: null } },
      select: { id: true },
    });
    for (const client of existingClients) {
      try {
        await syncClientCalendar(client.id);
      } catch (syncError) {
        console.error(
          `Google Calendar sync failed for client ${client.id}`,
          syncError,
        );
      }
    }
    store.delete("google_calendar_state");
  } catch (error) {
    console.error("Google Calendar callback failed", error);
    redirect("/parametres/packs?calendar=error");
  }
  redirect(
    `/parametres/packs?calendar=connected&email=${encodeURIComponent(email)}`,
  );
}
