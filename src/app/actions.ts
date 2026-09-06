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
class InvalidClient extends Error {}
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
    const defenseDate = new Date(`${date}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(defenseDate.getTime()) ||
      defenseDate.toISOString().slice(0, 10) !== date
    )
      throw new InvalidClient("Renseignez une date de soutenance valide.");
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
    return {
      error:
        error instanceof InvalidClient
          ? error.message
          : "Impossible d’enregistrer. Vérifiez notamment que l’e-mail n’est pas déjà utilisé, puis réessayez.",
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
export async function deleteClient(data: FormData) {
  await requirePermission("canManageClients");
  const id = idValue(text(data, "id"))!;
  await prisma.client.delete({ where: { id } });
  revalidatePath("/");
  revalidateTag("clients", "max");
}
