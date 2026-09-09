"use server";
import { revalidatePath } from "next/cache";
import { requirePermission, requireUser, userRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskStatuses, type TaskStatus } from "./options";
import type { MontageTask } from "./types";
export type TaskState = { error?: string; success?: boolean; row?: MontageTask };
async function requireTaskAccess() {
  const user = await requireUser();
  const role = userRole(user);
  if (role === "ADMIN" || role === "MANAGER") return user;
  if (role === "MONTAGE") return user;
  throw new Error("Accès refusé.");
}
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
function validStatus(value: string): value is TaskStatus { return (taskStatuses as readonly string[]).includes(value); }
async function serialize(id: number): Promise<MontageTask> {
  const row = await prisma.editorTask.findUniqueOrThrow({ where: { id }, include: { editor: true, client: { select: { id: true, name: true } } } });
  return { id: row.id, title: row.title, description: row.description, status: row.status, dueDate: row.dueDate?.toISOString().slice(0, 10) ?? null, editorId: row.editorId, editorName: row.editor.name, editorPhone: row.editor.phone, clientId: row.clientId, clientName: row.client?.name ?? null };
}
export async function saveMontageTask(_: TaskState, data: FormData): Promise<TaskState> {
  await requirePermission("canManageClients");
  const idRaw = text(data, "id"); const id = idRaw ? Number(idRaw) : undefined;
  const title = text(data, "title"); const description = text(data, "description");
  const editorId = Number(text(data, "editorId")); const clientRaw = text(data, "clientId"); const clientId = clientRaw ? Number(clientRaw) : null;
  const status = text(data, "status"); const dueRaw = text(data, "dueDate");
  if (!title || title.length > 160) return { error: "Donnez un titre de 1 à 160 caractères." };
  if (!Number.isSafeInteger(editorId) || editorId < 1) return { error: "Sélectionnez un monteur." };
  if (!validStatus(status)) return { error: "Statut invalide." };
  if (dueRaw && !/^\d{4}-\d{2}-\d{2}$/.test(dueRaw)) return { error: "Date limite invalide." };
  try {
    const payload = { title, description: description || null, status, dueDate: dueRaw ? new Date(`${dueRaw}T00:00:00.000Z`) : null, editorId, clientId: clientId && Number.isSafeInteger(clientId) ? clientId : null };
    const saved = id && Number.isSafeInteger(id) ? await prisma.editorTask.update({ where: { id }, data: payload }) : await prisma.editorTask.create({ data: payload });
    revalidatePath("/montage"); return { success: true, row: await serialize(saved.id) };
  } catch { return { error: "Impossible d’enregistrer cette tâche." }; }
}
export async function updateMontageTaskStatus(id: number, status: string): Promise<TaskState> {
  await requireTaskAccess();
  if (!Number.isSafeInteger(id) || !validStatus(status)) return { error: "Statut invalide." };
  try { await prisma.editorTask.update({ where: { id }, data: { status } }); revalidatePath("/montage"); return { success: true }; } catch { return { error: "Impossible de modifier le statut." }; }
}
export async function deleteMontageTask(id: number): Promise<TaskState> {
  await requirePermission("canManageClients");
  try { await prisma.editorTask.delete({ where: { id } }); revalidatePath("/montage"); return { success: true }; } catch { return { error: "Impossible de supprimer cette tâche." }; }
}
