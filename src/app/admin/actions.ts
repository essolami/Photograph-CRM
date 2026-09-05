"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type UserActionState = { error?: string; success?: boolean };
const checked = (data: FormData, key: string) => data.get(key) === "on";

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
  if (!name || !/^\S+@\S+\.\S+$/.test(email))
    return { error: "Enter a name and valid email." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        isActive: true,
        canViewClients: checked(data, "canViewClients"),
        canManageClients: checked(data, "canManageClients"),
        canViewInvoices: checked(data, "canViewInvoices"),
        canManageInvoices: checked(data, "canManageInvoices"),
        canManageUsers: checked(data, "canManageUsers"),
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "A user with this email may already exist." };
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
    await prisma.user.update({
      where: { id },
      data: {
        isActive: isSelf ? true : checked(data, "isActive"),
        canViewClients: checked(data, "canViewClients"),
        canManageClients: checked(data, "canManageClients"),
        canViewInvoices: checked(data, "canViewInvoices"),
        canManageInvoices: checked(data, "canManageInvoices"),
        canManageUsers: isSelf ? true : checked(data, "canManageUsers"),
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { error: "Could not save this user's permissions." };
  }
}
