import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "luma_session";
const SESSION_DAYS = 14;

export type Permission =
  | "canViewClients"
  | "canManageClients"
  | "canViewInvoices"
  | "canManageInvoices"
  | "canManageUsers";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, tokenHash: tokenHash(token), expiresAt },
  });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token)
    await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  store.delete(COOKIE_NAME);
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date() || !session.user.isActive)
    return null;
  return session.user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!user[permission])
    throw new Error("You do not have permission to perform this action.");
  return user;
}
