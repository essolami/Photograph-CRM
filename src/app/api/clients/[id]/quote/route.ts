import { getCurrentUser, userRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClientQuote } from "@/lib/client-quote";
import type { SupplementChoice } from "@/lib/client-data";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (
    !user ||
    !user.canViewClients ||
    !["ADMIN", "MANAGER"].includes(userRole(user))
  )
    return new Response("Non autorisé", { status: 403 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1)
    return new Response("Identifiant invalide", { status: 400 });
  const client = await prisma.client.findUnique({ where: { id: Number(id) } });
  if (!client) return new Response("Client introuvable", { status: 404 });
  const pdf = await createClientQuote({
    ...client,
    basePrice: client.basePrice.toString(),
    supplements: Array.isArray(client.supplements)
      ? (client.supplements as SupplementChoice[])
      : [],
    discount: client.discount.toString(),
    total: client.total.toString(),
    advance: client.advance.toString(),
  });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="devis-${client.id}.pdf"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
