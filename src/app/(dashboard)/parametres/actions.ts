"use server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { sections, type Section } from "./config";
export type State = { error?: string; success?: string };
function money(data: FormData, key: string) {
  const value = String(data.get(key) ?? "")
    .trim()
    .replace(",", ".");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value))
    throw new Error(
      "Saisissez un montant positif ou nul, avec deux décimales maximum.",
    );
  return value;
}
export async function saveSetting(_: State, data: FormData): Promise<State> {
  await requirePermission("canManageUsers");
  const section = String(data.get("section"));
  if (!Object.hasOwn(sections, section))
    return { error: "Catégorie inconnue." };
  const kind = sections[section as Section].kind;
  const id = data.get("id") ? Number(data.get("id")) : undefined;
  if (id !== undefined && (!Number.isSafeInteger(id) || id < 1))
    return { error: "Identifiant invalide." };
  try {
    {
      const name = String(data.get("name") ?? "").trim();
      if (!name || name.length > 120)
        return { error: "Le nom doit contenir entre 1 et 120 caractères." };
      const common = { name, isActive: data.get("isActive") === "on" };
      switch (kind) {
        case "pack": {
          const rowKeys = data.getAll("rowKey").map(String);
          if (
            !rowKeys.length ||
            rowKeys.length > 100 ||
            new Set(rowKeys).size !== rowKeys.length ||
            rowKeys.some((key) => !/^[a-zA-Z0-9_-]+$/.test(key))
          )
            return {
              error:
                "Ajoutez au moins une faculté avec ses tarifs (100 maximum).",
            };
          const prices = rowKeys.map((key) => ({
            name: String(data.get(`facultyName_${key}`) ?? "").trim(),
            soloPrice: money(data, `soloPrice_${key}`),
            duoPrice: money(data, `duoPrice_${key}`),
          }));
          if (prices.some((price) => !price.name || price.name.length > 120))
            return {
              error: "Chaque faculté doit avoir un nom de 1 à 120 caractères.",
            };
          if (
            new Set(prices.map((price) => price.name.toLocaleLowerCase("fr")))
              .size !== prices.length
          )
            return {
              error:
                "Chaque faculté doit apparaître une seule fois dans ce pack.",
            };
          await prisma.$transaction(async (tx) => {
            const item = id
              ? await tx.pack.update({ where: { id }, data: common })
              : await tx.pack.create({ data: common });
            const facultyIds: number[] = [];
            for (const price of prices) {
              const faculty = await tx.faculty.upsert({
                where: { name: price.name },
                create: { name: price.name },
                update: {},
              });
              facultyIds.push(faculty.id);
              const pair = { packId: item.id, facultyId: faculty.id };
              const values = {
                soloPrice: price.soloPrice,
                duoPrice: price.duoPrice,
              };
              await tx.facultyPackRate.upsert({
                where: { facultyId_packId: pair },
                create: { ...pair, ...values },
                update: values,
              });
            }
            await tx.facultyPackRate.deleteMany({
              where: { packId: item.id, facultyId: { notIn: facultyIds } },
            });
          });
          break;
        }
        case "supplement": {
          const values = { ...common, price: money(data, "price") };
          if (id)
            await prisma.supplement.update({ where: { id }, data: values });
          else await prisma.supplement.create({ data: values });
          break;
        }
        case "photographer":
          {
            const phone = String(data.get("phone") ?? "").trim();
            if (phone && !/^\+?[\d\s().-]{6,30}$/.test(phone))
              return { error: "Renseignez un numéro de téléphone valide." };
            const values = { ...common, phone: phone || null };
            if (id)
              await prisma.photographer.update({ where: { id }, data: values });
            else await prisma.photographer.create({ data: values });
          }
          break;
        case "editor": {
          const phone = String(data.get("phone") ?? "").trim();
          if (phone && !/^\+?[\d\s().-]{6,30}$/.test(phone))
            return { error: "Renseignez un numéro de téléphone valide." };
          const values = { ...common, phone: phone || null };
          if (id) await prisma.editor.update({ where: { id }, data: values });
          else await prisma.editor.create({ data: values });
          break;
        }
      }
    }
    revalidatePath("/parametres", "layout");
    revalidateTag("settings", "max");
    revalidateTag("clients", "max");
    return { success: "Enregistrement effectué." };
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    console.error("Setting save failed", { section, id, error });
    const meta = (error as { meta?: { target?: string[] } } | null)?.meta;
    if (code === "P2002" && meta?.target?.includes("name"))
      return {
        error:
          kind === "pack"
            ? "Ce nom de pack existe déjà. Fermez ce panneau, cliquez sur Modifier (crayon) sur le pack existant, puis sur + Ajouter une faculté."
            : "Ce nom existe déjà. Choisissez un autre nom ou modifiez l’élément existant.",
      };
    if (code === "P2025" || code === "P2003")
      return {
        error: "Un élément a été supprimé. Actualisez la page puis réessayez.",
      };
    if (error instanceof Error && error.message.startsWith("Saisissez"))
      return { error: error.message };
    return {
      error:
        "Impossible d’enregistrer pour le moment. Réessayez ; si le problème persiste, contactez l’administrateur.",
    };
  }
}

export async function deleteSetting(
  section: string,
  id: number,
): Promise<State> {
  await requirePermission("canManageUsers");
  if (!Object.hasOwn(sections, section) || !Number.isSafeInteger(id) || id < 1)
    return { error: "Élément invalide." };
  try {
    switch (sections[section as Section].kind) {
      case "pack":
        await prisma.pack.delete({ where: { id } });
        break;
      case "supplement":
        await prisma.supplement.delete({ where: { id } });
        break;
      case "photographer":
        await prisma.photographer.delete({ where: { id } });
        break;
      case "editor":
        await prisma.editor.delete({ where: { id } });
        break;
    }
    revalidatePath("/parametres", "layout");
    revalidateTag("settings", "max");
    revalidateTag("clients", "max");
    return { success: "Élément supprimé." };
  } catch {
    return {
      error:
        "Impossible de supprimer cet élément. Il a peut-être déjà été supprimé ou est encore utilisé.",
    };
  }
}
