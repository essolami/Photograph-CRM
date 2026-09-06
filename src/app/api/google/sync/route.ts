import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { syncClientCalendar } from "@/lib/google-calendar";

export async function GET() {
  await requirePermission("canManageUsers");
  const clients = await prisma.client.findMany({
    where: { defenseDate: { not: null } },
    select: { id: true },
  });
  let synced = 0;
  for (const client of clients) {
    try {
      if (await syncClientCalendar(client.id)) synced += 1;
    } catch (error) {
      console.error(
        `Google Calendar sync failed for client ${client.id}`,
        error,
      );
    }
  }
  redirect(`/parametres/packs?calendar=synced&count=${synced}`);
}
