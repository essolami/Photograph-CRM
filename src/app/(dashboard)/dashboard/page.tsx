import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardOverview } from "./dashboard-overview";

export const dynamic = "force-dynamic";

const togeSelect = {
  id: true, customerName: true, createdAt: true,
  element: true, color: true, size: true, location: true,
  price: true, advance: true, isDelivered: true,
} as const;

async function getToges() {
  try {
    return await prisma.togeSale.findMany({
      select: { ...togeSelect, clientId: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "P2022")) throw error;
    const rows = await prisma.togeSale.findMany({ select: togeSelect, orderBy: { createdAt: "desc" } });
    return rows.map((row) => ({ ...row, clientId: null }));
  }
}

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user.canManageClients && !user.canManageUsers) redirect("/forbidden");

  const [clients, toges, tasks] = await Promise.all([
    prisma.client.findMany({
      select: {
        id: true, name: true, defenseDate: true, createdAt: true,
        facultyName: true, packName: true, status: true,
        total: true, advance: true, discount: true, grossProfit: true,
        supplements: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    getToges(),
    prisma.editorTask.findMany({
      select: {
        id: true, title: true, status: true, dueDate: true, createdAt: true,
        editor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return <DashboardOverview
    clients={clients.map((row) => ({
      ...row,
      defenseDate: row.defenseDate?.toISOString().slice(0, 10) ?? "",
      createdAt: row.createdAt.toISOString().slice(0, 10),
      total: Number(row.total), advance: Number(row.advance),
      discount: Number(row.discount), grossProfit: Number(row.grossProfit ?? 0),
      supplements: Array.isArray(row.supplements) ? row.supplements.flatMap((value) =>
        value && typeof value === "object" && !Array.isArray(value) && typeof value.name === "string"
          ? [{ name: value.name, price: Number(value.price ?? 0) }]
          : [],
      ) : [],
    }))}
    toges={toges.map((row) => ({
      ...row, createdAt: row.createdAt.toISOString().slice(0, 10),
      price: Number(row.price), advance: Number(row.advance),
    }))}
    tasks={tasks.map((row) => ({
      id: row.id, title: row.title, status: row.status,
      dueDate: row.dueDate?.toISOString().slice(0, 10) ?? "",
      createdAt: row.createdAt.toISOString().slice(0, 10),
      editorName: row.editor.name,
    }))}
  />;
}
