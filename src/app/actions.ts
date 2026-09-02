"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type ClientActionState = {
  error?: string;
  success?: boolean;
};

function readClient(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !email) {
    throw new Error("Name and email are required.");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  return { name, email, phone: phone || null };
}

function friendlyError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("Unique constraint")) {
      return "A client with this email already exists.";
    }
    if (error.message === "Name and email are required." || error.message === "Enter a valid email address.") {
      return error.message;
    }
  }
  return "Something went wrong. Please try again.";
}

export async function createClient(
  _state: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  try {
    await prisma.client.create({ data: readClient(formData) });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function updateClient(
  _state: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  try {
    const id = Number(formData.get("id"));
    if (!Number.isInteger(id)) throw new Error("Invalid client.");
    await prisma.client.update({ where: { id }, data: readClient(formData) });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: friendlyError(error) };
  }
}

export async function deleteClient(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await prisma.client.delete({ where: { id } });
  revalidatePath("/");
}
