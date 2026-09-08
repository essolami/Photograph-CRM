"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { syncClientCalendar } from "@/lib/google-calendar";
import {
  cents,
  totalPrice,
  remainingPrice,
  projectStatuses,
  type SupplementChoice,
} from "@/lib/client-data";
export type ClientActionState = { error?: string; success?: boolean };
export type ClientImportState = { error?: string; success?: boolean; imported?: number; rows?: string[] };
class InvalidClient extends Error {}
const normalizeImport = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
const importValue = (row: Record<string, unknown>, aliases: string[]) => {
  const key = Object.keys(row).find((item) => aliases.includes(normalizeImport(item)));
  return key ? String(row[key] ?? "").trim() : "";
};
const amountFromCell = (value: string, label?: string) => {
  const match = label
    ? value.match(new RegExp(`${label}\\s*[:=]\\s*([\\d\\s.,]+)`, "i"))
    : value.match(/^\s*([\d\s.,]+)/);
  return match ? Number(match[1].replace(/\s/g, "").replace(",", ".")) : 0;
};
function importDate(value: string) {
  const match = value.match(/(\d{1,2})[\s/-]+(\d{1,2})[\s/-]+(\d{2,4})/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return new Date(`${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}T00:00:00.000Z`);
  }
  const iso = new Date(value);
  return iso;
}

export async function importClients(rows: unknown[], defaultPackId?: number): Promise<ClientImportState> {
  await requirePermission("canManageClients");
  if (!Array.isArray(rows) || rows.length === 0) return { error: "Le fichier ne contient aucune ligne." };
  if (rows.length > 1000) return { error: "Import limité à 1000 clients par fichier." };
  const errors: string[] = [];
  let imported = 0;
  await prisma.$transaction(async (tx) => {
    // A data-only dump can leave PostgreSQL sequences behind the imported IDs.
    // Align the next Client ID before creating imported rows.
    await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('"Client"', 'id'), COALESCE((SELECT MAX("id") FROM "Client"), 0) + 1, false)`;
    const [packs, faculties, supplements, photographers] = await Promise.all([
      tx.pack.findMany({ where: { isActive: true }, include: { rates: { include: { faculty: true } } } }),
      tx.faculty.findMany({ where: { isActive: true } }),
      tx.supplement.findMany({ where: { isActive: true } }),
      tx.photographer.findMany({ where: { isActive: true } }),
    ]);
    for (const [index, raw] of rows.entries()) {
      const row = raw as Record<string, unknown>;
      const line = index + 2;
      if (!Object.values(row).some((value) => String(value ?? "").trim() !== "")) continue;
      const cells = Object.values(row).map((value) => String(value ?? "").trim());
      const name = importValue(row, ["nomprenom", "nom", "name", "client", "nomcomplet", "prenomnom"]) || cells[1] || "";
      const dateText = importValue(row, ["date", "soutenance", "datesoutenance"]) || cells[0] || "";
      const packText = importValue(row, ["pack", "packchoisi", "prestation", "packdemande", "prestationdemandee"]) || cells[5] || "";
      const facultyText = importValue(row, ["fac", "faculte", "faculty", "faculteuniversite", "universite"]) || cells[3] || "";
      if (!name || !dateText || !facultyText) { errors.push(`Ligne ${line} : nom, date ou faculté manquant.`); continue; }
      const date = importDate(dateText);
      const fallbackPack = defaultPackId ? packs.find((item) => item.id === defaultPackId) : undefined;
      const pack = packs.find((item) => normalizeImport(item.name) === normalizeImport(packText)) ?? (!packText ? fallbackPack : undefined);
      const faculty = faculties.find((item) => normalizeImport(item.name) === normalizeImport(facultyText));
      if (!Number.isFinite(date.getTime()) || !pack || !faculty) { errors.push(`Ligne ${line} : date, pack ou faculté introuvable.`); continue; }
      const rate = pack.rates.find((item) => item.facultyId === faculty.id);
      if (!rate) { errors.push(`Ligne ${line} : aucun tarif pour ${pack.name} / ${faculty.name}.`); continue; }
      const supplementText = importValue(row, ["supplement", "supplements", "options"]);
      const isChecked = (value: unknown) => {
        const raw = String(value ?? "").trim().toLocaleLowerCase("fr");
        const normalized = normalizeImport(value);
        return ["true", "oui", "yes", "1", "x", "checked", "✓", "☑"].includes(raw) || normalized === "true" || normalized === "oui" || normalized === "yes" || normalized === "1" || normalized === "x" || normalized === "checked";
      };
      const checkedSupplementNames = Object.entries(row)
        .filter(([key, value]) => isChecked(value) && ["toge", "persotoge", "tableau", "miroir", "album", "photobook", "deco", "rollup", "cadeau"].some((name) => normalizeImport(key).includes(name)))
        .map(([key]) => {
          const normalized = normalizeImport(key);
          return ["persotoge", "toge", "tableau", "miroir", "album", "photobook", "deco", "rollup", "cadeau"].find((name) => normalized.includes(name)) ?? normalized;
        });
      const selectedSupplements = supplements.filter((item) => {
        const itemName = normalizeImport(item.name);
        return (supplementText && normalizeImport(supplementText).includes(itemName)) || checkedSupplementNames.includes(itemName);
      }).map((item) => ({ id: item.id, name: item.name, price: item.price.toString() }));
      const isDuo = /binome|duo|oui/i.test(importValue(row, ["binome", "duo"]) || cells[4] || "");
      const basePrice = (isDuo ? rate.duoPrice : rate.soloPrice).toString();
      const paymentCell = importValue(row, ["avance", "paiement", "total", "totalapayer"]);
      const sheetTotal = amountFromCell(paymentCell, "total") || amountFromCell(importValue(row, ["total", "totalapayer"]));
      const total = sheetTotal || Number(basePrice) + selectedSupplements.reduce((sum, item) => sum + Number(item.price), 0);
      const advanceCell = importValue(row, ["avance", "paiement"]);
      const advance = amountFromCell(advanceCell, "avance") || amountFromCell(importValue(row, ["avance"]));
      const phone = importValue(row, ["telephone", "tel", "phone"]) || cells[2] || null;
      const photographerText = importValue(row, ["photographe", "photographer"]);
      const photographer = photographers.find((item) => normalizeImport(item.name) === normalizeImport(photographerText));
      const editorText = importValue(row, ["monteur", "editor"]);
      const editor = await tx.editor.findFirst({ where: { name: { equals: editorText, mode: "insensitive" } } });
      const statusText = importValue(row, ["statutduprojet", "statut", "status"]);
      const status = projectStatuses.includes(statusText as (typeof projectStatuses)[number]) ? statusText : "En cours";
      const discount = amountFromCell(importValue(row, ["reduction", "remise"]));
      const grossProfit = amountFromCell(importValue(row, ["gainbrut", "gain"]));
      const driveUrl = importValue(row, ["liendrive", "drive"]);
      const comment = importValue(row, ["commentaire", "comment"]);
      await tx.client.create({ data: { name, phone, email: null, defenseDate: date, packId: pack.id, facultyId: faculty.id, packName: pack.name, facultyName: faculty.name, isDuo, basePrice, supplements: selectedSupplements, discount, total, advance: Math.min(advance, total), photographerId: photographer?.id ?? null, editorId: editor?.id ?? null, status, driveUrl: driveUrl || null, comment: comment || null, grossProfit: grossProfit || null } });
      imported++;
    }
  });
  revalidatePath("/");
  return { success: true, imported, rows: errors };
}
const text = (data: FormData, key: string) =>
  String(data.get(key) ?? "").trim();
function idValue(value: string, optional = false) {
  if (!value && optional) return null;
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1)
    throw new InvalidClient("Sélectionnez un élément valide.");
  return id;
}
async function saveClient(
  data: FormData,
  editing: boolean,
): Promise<ClientActionState> {
  await requirePermission("canManageClients");
  try {
    let savedClientId: number;
    const id = editing ? idValue(text(data, "id")) : null;
    const name = text(data, "name"),
      phone = text(data, "phone"),
      email = text(data, "email").toLowerCase();
    if (!name || name.length > 120 || !/^[+\d\s().-]{6,30}$/.test(phone))
      throw new InvalidClient(
        "Renseignez un nom complet et un numéro de téléphone valide.",
      );
    if (email && (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)))
      throw new InvalidClient("Adresse e-mail invalide.");
    const date = text(data, "defenseDate");
    const time = text(data, "defenseTime");
    const defenseDate = new Date(`${date}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(defenseDate.getTime()) ||
      defenseDate.toISOString().slice(0, 10) !== date
    )
      throw new InvalidClient("Renseignez une date de soutenance valide.");
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
      throw new InvalidClient("Renseignez une heure de soutenance valide.");
    const status = text(data, "status");
    if (!projectStatuses.some((s) => s === status))
      throw new InvalidClient("Statut de projet invalide.");
    const driveUrl = text(data, "driveUrl");
    if (driveUrl) {
      try {
        const url = new URL(driveUrl);
        if (
          url.protocol !== "https:" ||
          !["drive.google.com", "docs.google.com"].includes(url.hostname)
        )
          throw new Error();
      } catch {
        throw new InvalidClient("Utilisez un lien Google Drive HTTPS valide.");
      }
    }
    const comment = text(data, "comment");
    if (comment.length > 5000 || driveUrl.length > 2000)
      throw new InvalidClient("Le commentaire ou le lien est trop long.");
    const advance = text(data, "advance") || "0";
    const discount = text(data, "discount") || "0",
      grossProfit = text(data, "grossProfit");
    try {
      cents(discount);
      cents(advance);
      if (grossProfit) cents(grossProfit);
    } catch {
      throw new InvalidClient(
        "Montant invalide : utilisez un nombre positif ou nul avec deux décimales maximum.",
      );
    }
    const packId = idValue(text(data, "packId"))!,
      facultyId = idValue(text(data, "facultyId"))!;
    const photographerId = idValue(text(data, "photographerId"), true),
      editorId = idValue(text(data, "editorId"), true);
    const isDuo = text(data, "isDuo") === "true";
    const supplementIds = data
      .getAll("supplementId")
      .map((value) => idValue(String(value))!);
    if (new Set(supplementIds).size !== supplementIds.length)
      throw new InvalidClient("Supplément en double.");
    await prisma.$transaction(async (tx) => {
      const existing = id
        ? await tx.client.findUniqueOrThrow({ where: { id } })
        : null;
      const sameRate =
        existing?.packId === packId &&
        existing?.facultyId === facultyId &&
        existing?.isDuo === isDuo;
      let basePrice: string, packName: string, facultyName: string;
      if (sameRate && existing?.packName && existing.facultyName) {
        basePrice = existing.basePrice.toString();
        packName = existing.packName;
        facultyName = existing.facultyName;
      } else {
        const rate = await tx.facultyPackRate.findUnique({
          where: { facultyId_packId: { facultyId, packId } },
          include: { pack: true, faculty: true },
        });
        if (!rate || !rate.pack.isActive || !rate.faculty.isActive)
          throw new InvalidClient(
            "Choisissez un pack et une faculté actifs avec un tarif configuré.",
          );
        basePrice = (isDuo ? rate.duoPrice : rate.soloPrice).toString();
        packName = rate.pack.name;
        facultyName = rate.faculty.name;
      }
      const oldSupplements = (existing?.supplements ??
        []) as SupplementChoice[];
      const supplements: SupplementChoice[] = [];
      for (const sid of supplementIds) {
        const old = oldSupplements.find((s) => s.id === sid);
        if (old) {
          supplements.push(old);
          continue;
        }
        const item = await tx.supplement.findUnique({ where: { id: sid } });
        if (!item?.isActive)
          throw new InvalidClient(
            "Un supplément sélectionné n’est plus disponible.",
          );
        supplements.push({
          id: item.id,
          name: item.name,
          price: item.price.toString(),
        });
      }
      if (photographerId) {
        const person = await tx.photographer.findUnique({
          where: { id: photographerId },
        });
        if (
          !person ||
          (!person.isActive && existing?.photographerId !== photographerId)
        )
          throw new InvalidClient("Photographe indisponible.");
      }
      if (editorId) {
        const person = await tx.editor.findUnique({ where: { id: editorId } });
        if (!person || (!person.isActive && existing?.editorId !== editorId))
          throw new InvalidClient("Monteur indisponible.");
      }
      let total: string;
      try {
        total = totalPrice(basePrice, supplements, discount);
        remainingPrice(total, advance);
      } catch (error) {
        throw new InvalidClient((error as Error).message);
      }
      const values = {
        name,
        phone,
        email: email || null,
        defenseDate,
        defenseTime: time || null,
        packId,
        facultyId,
        packName,
        facultyName,
        isDuo,
        basePrice,
        supplements,
        discount: discount.replace(",", "."),
        total,
        advance: advance.replace(",", "."),
        photographerId,
        editorId,
        status,
        driveUrl: driveUrl || null,
        comment: comment || null,
        grossProfit: grossProfit ? grossProfit.replace(",", ".") : null,
      };
      if (id) {
        await tx.client.update({ where: { id }, data: values });
        savedClientId = id;
      } else {
        const created = await tx.client.create({ data: values });
        savedClientId = created.id;
      }
    });
    try {
      await syncClientCalendar(savedClientId!);
    } catch (calendarError) {
      console.error("Google Calendar sync failed", calendarError);
    }
    revalidatePath("/");
    revalidateTag("clients", "max");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";
    console.error("Save client failed:", error);
    if (code === "P2002" || /unique constraint|duplicate key/i.test(message))
      return { error: "Cet e-mail est déjà utilisé par un autre client." };
    if (code === "P2022" || /column.*defenseTime|defenseTime.*column|does not exist/i.test(message))
      return { error: "La base de données n’est pas à jour. Exécutez la migration Prisma, puis réessayez." };
    if (code === "P2003")
      return { error: "Un pack, une faculté, un photographe ou un monteur sélectionné n’existe plus." };
    if (code === "P1001" || code === "P1002" || /timeout|timed out|connect/i.test(message))
      return { error: "La base de données est momentanément inaccessible. Réessayez dans quelques secondes." };
    return {
      error:
        error instanceof InvalidClient
          ? error.message
          : "Impossible d’enregistrer ce client. Consultez les logs du serveur pour le détail.",
    };
  }
}
export async function createClient(_: ClientActionState, data: FormData) {
  return saveClient(data, false);
}
export async function updateClient(_: ClientActionState, data: FormData) {
  return saveClient(data, true);
}

export async function updateClientQuick(
  data: FormData,
): Promise<ClientActionState> {
  await requirePermission("canManageClients");
  try {
    const id = idValue(text(data, "id"))!;
    const status = text(data, "status");
    if (!projectStatuses.some((value) => value === status))
      throw new InvalidClient("Statut de projet invalide.");
    const photographerId = idValue(text(data, "photographerId"), true);
    if (photographerId) {
      const photographer = await prisma.photographer.findUnique({
        where: { id: photographerId },
      });
      if (!photographer || !photographer.isActive)
        throw new InvalidClient("Photographe indisponible.");
    }
    await prisma.client.update({
      where: { id },
      data: { status, photographerId },
    });
    revalidatePath("/");
    revalidateTag("clients", "max");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof InvalidClient
          ? error.message
          : "Impossible de mettre à jour ce client.",
    };
  }
}

export async function updateClientDrive(
  _state: ClientActionState,
  data: FormData,
): Promise<ClientActionState> {
  const user = await requirePermission("canViewClients");
  if (user.role !== "MONTAGE" && user.role !== "ADMIN" && user.role !== "MANAGER")
    return { error: "Vous n’avez pas accès à cette modification." };
  const id = Number(data.get("id"));
  const driveUrl = String(data.get("driveUrl") ?? "").trim();
  if (!Number.isSafeInteger(id) || id < 1)
    return { error: "Client invalide." };
  if (driveUrl) {
    try {
      const url = new URL(driveUrl);
      if (url.protocol !== "https:" || !["drive.google.com", "docs.google.com"].includes(url.hostname)) throw new Error();
    } catch {
      return { error: "Utilisez un lien Google Drive HTTPS valide." };
    }
  }
  await prisma.client.update({ where: { id }, data: { driveUrl: driveUrl || null } });
  revalidatePath("/");
  revalidateTag("clients", "max");
  return { success: true };
}

export async function deleteClient(data: FormData) {
  await requirePermission("canManageClients");
  const id = idValue(text(data, "id"))!;
  await prisma.client.delete({ where: { id } });
  revalidatePath("/");
  revalidateTag("clients", "max");
}
