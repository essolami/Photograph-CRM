import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import {
  PAGE_SIZE,
  emptyClientFilters,
  type ClientFilters,
  type ClientPage,
  type ClientRecord,
  type SupplementChoice,
} from "./client-data";

const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const dayStart = (value: string) => new Date(`${value}T00:00:00.000Z`);
const today = () => new Date().toISOString().slice(0, 10);

// Les filtres arrivent du navigateur : on les ramène à une forme connue avant
// de construire la requête.
export function sanitizeClientFilters(input: unknown): ClientFilters {
  const raw = (input ?? {}) as Partial<Record<keyof ClientFilters, unknown>>;
  const text = (value: unknown, max = 120) => String(value ?? "").trim().slice(0, max);
  return {
    ...emptyClientFilters,
    query: text(raw.query),
    status: text(raw.status, 40),
    packId: text(raw.packId, 12),
    photographerId: text(raw.photographerId, 12),
    from: isDay(text(raw.from, 10)) ? text(raw.from, 10) : "",
    to: isDay(text(raw.to, 10)) ? text(raw.to, 10) : "",
    todayOnly: raw.todayOnly === true,
    faculty: text(raw.faculty, 120),
  };
}

export function clientWhere(filters: ClientFilters): Prisma.ClientWhereInput {
  const and: Prisma.ClientWhereInput[] = [];
  if (filters.query)
    and.push({
      OR: [
        { name: { contains: filters.query, mode: "insensitive" } },
        { phone: { contains: filters.query, mode: "insensitive" } },
        { email: { contains: filters.query, mode: "insensitive" } },
      ],
    });
  if (filters.status) and.push({ status: filters.status });
  const packId = Number(filters.packId);
  if (filters.packId && Number.isSafeInteger(packId) && packId > 0)
    and.push({ packId });
  if (filters.photographerId === "none") and.push({ photographerId: null });
  else {
    const photographerId = Number(filters.photographerId);
    if (filters.photographerId && Number.isSafeInteger(photographerId) && photographerId > 0)
      and.push({ photographerId });
  }
  if (filters.faculty)
    and.push({ facultyName: { equals: filters.faculty, mode: "insensitive" } });
  if (filters.todayOnly) and.push({ defenseDate: dayStart(today()) });
  if (filters.from) and.push({ defenseDate: { gte: dayStart(filters.from) } });
  if (filters.to) and.push({ defenseDate: { lte: dayStart(filters.to) } });
  return and.length ? { AND: and } : {};
}

type ClientRow = Prisma.ClientModel & {
  togeSale: { color: string; size: string; location: string } | null;
};

// Les montants et coordonnées ne sortent que pour les rôles autorisés.
export function toClientRecord(client: ClientRow, privateData: boolean): ClientRecord {
  return {
    id: client.id,
    name: client.name,
    phone: privateData ? client.phone : null,
    email: privateData ? client.email : null,
    defenseDate: client.defenseDate
      ? new Date(client.defenseDate).toISOString().slice(0, 10)
      : "",
    defenseTime: client.defenseTime,
    packId: client.packId,
    facultyId: client.facultyId,
    packName: client.packName,
    facultyName: client.facultyName,
    isDuo: client.isDuo,
    basePrice: privateData ? client.basePrice.toString() : "",
    supplements: Array.isArray(client.supplements)
      ? (client.supplements as SupplementChoice[])
      : [],
    extraLabel: client.extraLabel ?? null,
    extraAmount: privateData ? (client.extraAmount?.toString() ?? "0") : "",
    togeColor: client.togeSale?.color ?? null,
    togeSize: client.togeSale?.size ?? null,
    togeLocation: client.togeSale?.location ?? null,
    discount: privateData ? client.discount.toString() : "",
    total: privateData ? client.total.toString() : "",
    advance: privateData ? client.advance.toString() : "",
    photographerId: client.photographerId,
    editorId: client.editorId,
    status: client.status,
    driveUrl: client.driveUrl,
    comment: client.comment,
    grossProfit: privateData ? (client.grossProfit?.toString() ?? "") : "",
  };
}

const listQuery = {
  include: { togeSale: { select: { color: true, size: true, location: true } } },
  // Le second critère fige l'ordre : sans lui, deux dossiers créés dans la même
  // milliseconde pourraient changer de page entre deux requêtes.
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
} satisfies Prisma.ClientFindManyArgs;

export async function clientsPage(
  filters: ClientFilters,
  page: number,
  privateData: boolean,
): Promise<ClientPage> {
  const where = clientWhere(filters);
  const [rows, total] = await Promise.all([
    prisma.client.findMany({
      ...listQuery,
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.client.count({ where }),
  ]);
  return { rows: rows.map((row) => toClientRecord(row, privateData)), total };
}

// L'export Excel doit couvrir tous les dossiers filtrés, pas la page affichée.
export async function clientsForExport(
  filters: ClientFilters,
  privateData: boolean,
): Promise<ClientRecord[]> {
  const rows = await prisma.client.findMany({
    ...listQuery,
    where: clientWhere(filters),
    take: 5000,
  });
  return rows.map((row) => toClientRecord(row, privateData));
}
