import { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { PAGE_SIZE } from "./client-data";
import { emptyTogeFilters, type TogeFilters } from "@/app/toges/options";

export type TogeRow = {
  id: number;
  customerName: string;
  phone: string;
  element: string;
  color: string;
  size: string;
  location: string;
  price: string;
  discount: string;
  advance: string;
  isDelivered: boolean;
  createdAt: string;
};
export type TogePage = { rows: TogeRow[]; total: number };

const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const dayStart = (value: string) => new Date(`${value}T00:00:00.000Z`);
const dayAfter = (value: string) => new Date(dayStart(value).getTime() + 86400000);

export function sanitizeTogeFilters(input: unknown): TogeFilters {
  const raw = (input ?? {}) as Partial<Record<keyof TogeFilters, unknown>>;
  const text = (value: unknown, max = 60) => String(value ?? "").trim().slice(0, max);
  return {
    ...emptyTogeFilters,
    query: text(raw.query, 120),
    location: text(raw.location),
    color: text(raw.color),
    size: text(raw.size, 8),
    element: text(raw.element),
    delivered: text(raw.delivered, 4),
    payment: text(raw.payment, 4),
    from: isDay(text(raw.from, 10)) ? text(raw.from, 10) : "",
    to: isDay(text(raw.to, 10)) ? text(raw.to, 10) : "",
  };
}

// Le solde compare deux colonnes (`advance` contre `price - discount`), ce que
// l'API typée de Prisma ne sait pas exprimer : la clause est donc écrite en SQL
// paramétré.
function togeWhere(filters: TogeFilters) {
  const conditions: Prisma.Sql[] = [];
  if (filters.query) {
    const like = `%${filters.query.replace(/[%_\\]/g, (match) => `\\${match}`)}%`;
    conditions.push(
      Prisma.sql`("customerName" ILIKE ${like} OR "phone" ILIKE ${like} OR "element" ILIKE ${like})`,
    );
  }
  if (filters.location === "none")
    conditions.push(Prisma.sql`("location" IS NULL OR "location" = '')`);
  else if (filters.location) conditions.push(Prisma.sql`"location" = ${filters.location}`);
  if (filters.color) conditions.push(Prisma.sql`"color" = ${filters.color}`);
  if (filters.size) conditions.push(Prisma.sql`"size" = ${filters.size}`);
  if (filters.element) conditions.push(Prisma.sql`"element" = ${filters.element}`);
  if (filters.delivered)
    conditions.push(Prisma.sql`"isDelivered" = ${filters.delivered === "yes"}`);
  if (filters.payment === "paid")
    conditions.push(Prisma.sql`"advance" >= "price" - "discount"`);
  else if (filters.payment === "due")
    conditions.push(Prisma.sql`"advance" < "price" - "discount"`);
  if (filters.from) conditions.push(Prisma.sql`"createdAt" >= ${dayStart(filters.from)}`);
  if (filters.to) conditions.push(Prisma.sql`"createdAt" < ${dayAfter(filters.to)}`);
  return conditions.length
    ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
    : Prisma.empty;
}

type RawToge = Omit<TogeRow, "createdAt"> & { createdAt: Date };

export async function togesPage(
  filters: TogeFilters,
  page: number,
): Promise<TogePage> {
  const where = togeWhere(filters);
  const [rows, counted] = await Promise.all([
    prisma.$queryRaw<RawToge[]>`
      SELECT "id", "customerName", "phone", "element", "color", "size", "location",
             "price"::text AS "price", "discount"::text AS "discount",
             "advance"::text AS "advance", "isDelivered", "createdAt"
      FROM "TogeSale" ${where}
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    prisma.$queryRaw<{ total: number }[]>`SELECT COUNT(*)::int AS "total" FROM "TogeSale" ${where}`,
  ]);
  return {
    rows: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    total: counted[0]?.total ?? 0,
  };
}
