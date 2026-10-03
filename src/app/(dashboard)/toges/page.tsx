import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { togesPage } from "@/lib/toge-list";
import { emptyTogeFilters } from "@/app/toges/options";
import { TogeManager } from "@/app/toges/toge-manager";

export const dynamic = "force-dynamic";

export default async function TogesPage() {
  const user = await requireUser();
  if (!user.canManageClients) redirect("/forbidden");
  // Première page seulement : la suite est chargée par `fetchTogesPage`.
  const { rows, total } = await togesPage(emptyTogeFilters, 1);
  return <TogeManager initialRows={rows} initialTotal={total} />;
}
