"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { colors, elementPrices, elements, locations, sizes } from "./options";

export type SavedToge = {
  id: number;
  customerName: string;
  phone: string;
  element: string;
  color: string;
  size: string;
  location: string;
  price: string;
  advance: string;
  isDelivered: boolean;
};
export type TogeState = { error?: string; success?: boolean; row?: SavedToge };

function value(data: FormData, key: string) { return String(data.get(key) ?? "").trim(); }
function money(data: FormData, key: string) {
  const input = value(data, key).replace(",", ".");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(input)) throw new Error("Montant invalide.");
  return input;
}
function included<T extends readonly string[]>(list: T, input: string): input is T[number] {
  return (list as readonly string[]).includes(input);
}

export async function saveToge(_: TogeState, data: FormData): Promise<TogeState> {
  await requirePermission("canManageClients");
  const idValue = value(data, "id");
  const id = idValue ? Number(idValue) : undefined;
  const customerName = value(data, "customerName");
  const phone = value(data, "phone");
  const element = value(data, "element").toUpperCase();
  const color = value(data, "color").toUpperCase();
  const size = value(data, "size").toUpperCase();
  const location = value(data, "location").toUpperCase();
  if (!customerName || customerName.length > 120) return { error: "Renseignez le nom du client." };
  if (!/^\+?[\d\s().-]{6,30}$/.test(phone)) return { error: "Renseignez un numéro de téléphone valide." };
  if (!included(elements, element)) return { error: "Élément invalide." };
  if (!included(colors, color)) return { error: "Couleur invalide." };
  if (!included(sizes, size)) return { error: "Taille invalide." };
  if (!included(locations, location)) return { error: "Localisation invalide." };
  try {
    const price = String(elementPrices[element as keyof typeof elementPrices]);
    const advance = money(data, "advance");
    if (Number(advance) > Number(price)) return { error: "L’avance ne peut pas dépasser le prix." };
    const isDelivered = data.get("isDelivered") === "on";
    const payload = { customerName, phone, element, color, size, location, price, advance, isDelivered };
    const saved = id && Number.isSafeInteger(id)
      ? await prisma.togeSale.update({ where: { id }, data: payload })
      : await prisma.togeSale.create({ data: payload });
    revalidatePath("/toges");
    return { success: true, row: { ...saved, price: saved.price.toString(), advance: saved.advance.toString() } };
  } catch (error) {
    return { error: error instanceof Error && error.message === "Montant invalide." ? error.message : "Impossible d’enregistrer cette vente." };
  }
}

export async function updateTogeDelivered(id: number, isDelivered: boolean): Promise<TogeState> {
  await requirePermission("canManageClients");
  if (!Number.isSafeInteger(id)) return { error: "Identifiant invalide." };
  try {
    await prisma.togeSale.update({ where: { id }, data: { isDelivered } });
    revalidatePath("/toges");
    return { success: true };
  } catch {
    return { error: "Impossible de modifier le statut." };
  }
}

export async function deleteToge(id: number): Promise<TogeState> {
  await requirePermission("canManageClients");
  if (!Number.isSafeInteger(id)) return { error: "Identifiant invalide." };
  try { await prisma.togeSale.delete({ where: { id } }); revalidatePath("/toges"); return { success: true }; }
  catch { return { error: "Impossible de supprimer cette vente." }; }
}
