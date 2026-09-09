"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type UserActionState = { error?: string; success?: boolean };
const roles = ["ADMIN", "MANAGER", "MONTAGE", "USER"] as const;
type Role = (typeof roles)[number];
const checked = (data: FormData, key: string) => data.get(key) === "on";
function roleValue(data: FormData): Role | null {
  const role = String(data.get("role") ?? "");
  return (roles as readonly string[]).includes(role) ? (role as Role) : null;
}
function permissionsFor(role: Role) {
  return {
    canViewClients: true,
    canManageClients: role === "ADMIN" || role === "MANAGER",
    canViewInvoices: role === "ADMIN" || role === "MANAGER",
    canManageInvoices: role === "ADMIN" || role === "MANAGER",
    canManageUsers: role === "ADMIN",
  };
}

export async function createUser(
  _state: UserActionState,
  data: FormData,
): Promise<UserActionState> {
  await requirePermission("canManageUsers");
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(data.get("password") ?? "");
  const role = roleValue(data);
  if (!name || !/^\S+@\S+\.\S+$/.test(email))
    return { error: "Enter a name and valid email." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  if (!role) return { error: "Sélectionnez un rôle valide." };
  const editorId = role === "MONTAGE" ? Number(data.get("editorId")) : null;
  if (role === "MONTAGE" && (editorId === null || !Number.isSafeInteger(editorId) || editorId < 1)) return { error: "Sélectionnez le monteur associé à ce compte." };
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        isActive: true,
        role,
        editorId,
        ...permissionsFor(role),
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";
    console.error("Create user failed:", error);
    if (
      code === "P2022" ||
      /column.*role|role.*column|does not exist/i.test(message)
    )
      return { error: "La base de données n’est pas à jour. Exécutez npx prisma migrate deploy." };
    if (
      code === "P2002" ||
      /unique constraint|duplicate key|already exists/i.test(message)
    )
      return { error: "Cette adresse e-mail existe déjà." };
    if (code === "P1001" || code === "P1002" || /timeout|timed out|connect/i.test(message))
      return { error: "La base de données est momentanément inaccessible. Réessayez dans quelques secondes." };
    return { error: "Impossible de créer ce compte. Consultez les logs du serveur." };
  }
}

export async function updateUser(
  _state: UserActionState,
  data: FormData,
): Promise<UserActionState> {
  try {
    const actor = await requirePermission("canManageUsers");
    const id = Number(data.get("id"));
    if (!Number.isInteger(id)) return { error: "Invalid user." };
    const isSelf = actor.id === id;
    const role = roleValue(data);
    if (!role) return { error: "Sélectionnez un rôle valide." };
    const editorId = role === "MONTAGE" ? Number(data.get("editorId")) : null;
    if (role === "MONTAGE" && (editorId === null || !Number.isSafeInteger(editorId) || editorId < 1)) return { error: "Sélectionnez le monteur associé à ce compte." };
    if (isSelf && role !== "ADMIN")
      return { error: "Le compte administrateur actuel doit rester administrateur." };
    await prisma.user.update({
      where: { id },
      data: {
        isActive: isSelf ? true : checked(data, "isActive"),
        role,
        editorId,
        ...permissionsFor(role),
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Update user failed:", error);
    return { error: "Impossible d’enregistrer ce rôle. Vérifiez la migration de la base." };
  }
}
