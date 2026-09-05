export const projectStatuses = [
  "En cours",
  "À photographier",
  "En montage",
  "Terminé",
  "Livré",
  "Annulé",
] as const;
export type SupplementChoice = { id: number; name: string; price: string };
export type ClientRecord = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  defenseDate: string;
  packId: number | null;
  facultyId: number | null;
  packName: string | null;
  facultyName: string | null;
  isDuo: boolean;
  basePrice: string;
  supplements: SupplementChoice[];
  discount: string;
  total: string;
  advance: string;
  photographerId: number | null;
  editorId: number | null;
  status: string;
  driveUrl: string | null;
  comment: string | null;
  grossProfit: string;
};
export type ClientCatalog = {
  packs: {
    id: number;
    name: string;
    rates: {
      facultyId: number;
      name: string;
      soloPrice: string;
      duoPrice: string;
    }[];
  }[];
  supplements: SupplementChoice[];
  photographers: {
    id: number;
    name: string;
    phone: string | null;
    isActive: boolean;
  }[];
  editors: { id: number; name: string; isActive: boolean }[];
};
export function cents(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalized))
    throw new Error("Montant invalide (deux décimales maximum).");
  const [whole, fraction = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function totalPrice(
  base: string,
  supplements: SupplementChoice[],
  discount: string,
) {
  const total =
    cents(base) +
    supplements.reduce((sum, item) => sum + cents(item.price), 0) -
    cents(discount);
  if (total < 0)
    throw new Error("La réduction dépasse le montant de la prestation.");
  if (total > 9999999999)
    throw new Error("Le total dépasse le montant maximum autorisé.");
  return (total / 100).toFixed(2);
}
export const formatDh = (value: string) =>
  new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value)) + " DH";

export function remainingPrice(total: string, advance: string) {
  const remaining = cents(total) - cents(advance);
  if (remaining < 0)
    throw new Error("L’avance ne peut pas dépasser le total à payer.");
  return (remaining / 100).toFixed(2);
}
