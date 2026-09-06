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
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        isActive: true,
        role,
        ...permissionsFor(role),
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("Create user failed:", message);
    if (message.includes("role") && message.includes("column"))
      return { error: "La base de données n’est pas à jour. Exécutez npx prisma migrate deploy." };
    if (message.includes("Unique constraint") || message.includes("unique"))
      return { error: "Cette adresse e-mail existe déjà." };
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
    if (isSelf && role !== "ADMIN")
      return { error: "Le compte administrateur actuel doit rester administrateur." };
    await prisma.user.update({
      where: { id },
      data: {
        isActive: isSelf ? true : checked(data, "isActive"),
        role,
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
