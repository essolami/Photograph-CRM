"use server";

import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type LoginState = { error?: string };

export async function login(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    !user.isActive ||
    !(await verifyPassword(password, user.passwordHash))
  )
    return { error: "Invalid email or password." };
  await startSession(user.id);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}
