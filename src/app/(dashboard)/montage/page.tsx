import { redirect } from "next/navigation";
import { requireUser, userRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MontageManager } from "@/app/montage/montage-manager";
export default async function MontagePage() {
  const user = await requireUser(); const role = userRole(user); if (role === "USER") redirect("/forbidden");
  const [editors, clients, tasks] = await Promise.all([
    prisma.editor.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, phone: true } }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.editorTask.findMany({ orderBy: { updatedAt: "desc" }, include: { editor: true, client: { select: { id: true, name: true } } } }),
  ]);
  const initialTasks = tasks.map((row) => ({ id: row.id, title: row.title, description: row.description, status: row.status, dueDate: row.dueDate?.toISOString().slice(0, 10) ?? null, editorId: row.editorId, editorName: row.editor.name, editorPhone: row.editor.phone, clientId: row.clientId, clientName: row.client?.name ?? null }));
  return <MontageManager initialTasks={initialTasks} editors={editors} clients={clients} canManage={role === "ADMIN" || role === "MANAGER"} />;
}
