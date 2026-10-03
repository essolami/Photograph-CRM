"use server";

import { requireUser, userRole } from "@/lib/auth";
import {
  clientsForExport,
  clientsPage,
  sanitizeClientFilters,
} from "@/lib/client-list";
import type { ClientPage, ClientRecord } from "@/lib/client-data";

async function viewer() {
  const user = await requireUser();
  if (!user.canViewClients)
    throw new Error("Vous n’avez pas accès aux clients.");
  return { user, privateData: ["ADMIN", "MANAGER"].includes(userRole(user)) };
}

export async function fetchClientsPage(
  filters: unknown,
  page: unknown,
): Promise<ClientPage> {
  const { privateData } = await viewer();
  const requested = Number(page);
  const safePage = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  return clientsPage(sanitizeClientFilters(filters), safePage, privateData);
}

export async function fetchClientsForExport(
  filters: unknown,
): Promise<ClientRecord[]> {
  const { user, privateData } = await viewer();
  if (!user.canManageUsers)
    throw new Error("Vous n’avez pas accès à l’export.");
  return clientsForExport(sanitizeClientFilters(filters), privateData);
}
