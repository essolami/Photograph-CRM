// Lien « Ajouter à Google Agenda » : il ouvre l'agenda du compte déjà connecté
// dans le navigateur, avec l'événement pré-rempli. Aucune API, aucun jeton.
const TIME_ZONE = "Africa/Casablanca";
const pad = (value: number) => String(value).padStart(2, "0");
const compact = (date: string) => date.replace(/-/g, "");

export type CalendarEventInput = {
  name: string;
  defenseDate: string;
  defenseTime: string | null;
  facultyName: string | null;
  packName: string | null;
  isDuo: boolean;
  supplements: { name: string }[];
  phone: string | null;
  photographerName: string | null;
  comment: string | null;
  // Montants affichés seulement si l'utilisateur a le droit de les voir.
  amounts: { total: string; advance: string; remaining: string } | null;
};

// Les deux bornes sont exprimées en heure locale : `ctz` dit à Google comment
// les interpréter, ce qui évite toute conversion hasardeuse.
function range(date: string, time: string | null) {
  if (!time) {
    const next = new Date(`${date}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return `${compact(date)}/${compact(next.toISOString().slice(0, 10))}`;
  }
  const [hours, minutes] = time.split(":").map(Number);
  const start = new Date(`${date}T00:00:00.000Z`);
  start.setUTCHours(hours, minutes);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const stamp = (value: Date) =>
    `${compact(value.toISOString().slice(0, 10))}T${pad(value.getUTCHours())}${pad(value.getUTCMinutes())}00`;
  return `${stamp(start)}/${stamp(end)}`;
}

export function googleCalendarEventUrl(client: CalendarEventInput) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(client.defenseDate)) return null;
  const prestation = [client.packName, ...client.supplements.map((item) => item.name)]
    .filter(Boolean)
    .join(" + ");
  const details = [
    `Client : ${client.name}`,
    client.phone ? `Téléphone : ${client.phone}` : "",
    client.facultyName ? `Faculté : ${client.facultyName}` : "",
    prestation ? `Prestation : ${prestation}` : "",
    `Format : ${client.isDuo ? "Binôme" : "Solo"}`,
    client.photographerName ? `Photographe : ${client.photographerName}` : "",
    client.amounts ? `Total : ${client.amounts.total}` : "",
    client.amounts ? `Avance : ${client.amounts.advance}` : "",
    client.amounts ? `Reste : ${client.amounts.remaining}` : "",
    client.comment ? `Commentaire : ${client.comment}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const parameters = new URLSearchParams({
    action: "TEMPLATE",
    text: `Soutenance ${client.name}`,
    dates: range(client.defenseDate, client.defenseTime),
    details,
    ctz: TIME_ZONE,
  });
  if (client.facultyName) parameters.set("location", client.facultyName);
  return `https://calendar.google.com/calendar/render?${parameters.toString()}`;
}
