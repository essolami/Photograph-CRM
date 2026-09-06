import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TogeManager } from "@/app/toges/toge-manager";

export default async function TogesPage() {
  const user = await requireUser();
  if (!user.canManageClients) redirect("/forbidden");
  const rows = await prisma.togeSale.findMany({ orderBy: { createdAt: "desc" } });
  return <TogeManager initialRows={rows.map((row) => ({ ...row, price: row.price.toString(), advance: row.advance.toString() }))} />;
}
