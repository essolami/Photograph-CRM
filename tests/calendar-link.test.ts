import assert from "node:assert/strict";
import test from "node:test";
import { googleCalendarEventUrl, type CalendarEventInput } from "../src/lib/calendar-link";

const client: CalendarEventInput = {
  name: "Sara Rayane",
  defenseDate: "2026-10-15",
  defenseTime: "14:30",
  facultyName: "FMDC/FMPC",
  packName: "Pack 2",
  isDuo: false,
  supplements: [{ name: "Toge" }, { name: "Album" }],
  phone: "0661555601",
  photographerName: "Youssef",
  comment: "Prévoir la toge noire",
  amounts: { total: "2 430,00 DH", advance: "1 000,00 DH", remaining: "1 430,00 DH" },
};

const parameters = (url: string) => new URL(url).searchParams;

test("l’événement couvre une heure à partir de l’heure de soutenance", () => {
  const url = googleCalendarEventUrl(client)!;
  assert.equal(parameters(url).get("dates"), "20261015T143000/20261015T153000");
  assert.equal(parameters(url).get("ctz"), "Africa/Casablanca");
  assert.equal(parameters(url).get("text"), "Soutenance Sara Rayane");
  assert.equal(parameters(url).get("location"), "FMDC/FMPC");
});

test("une soutenance sans heure devient un événement sur la journée", () => {
  const url = googleCalendarEventUrl({ ...client, defenseTime: null })!;
  assert.equal(parameters(url).get("dates"), "20261015/20261016");
});

test("une heure tardive bascule la fin sur le lendemain", () => {
  const url = googleCalendarEventUrl({ ...client, defenseTime: "23:30" })!;
  assert.equal(parameters(url).get("dates"), "20261015T233000/20261016T003000");
});

test("le détail reprend la prestation, et les montants seulement si autorisés", () => {
  const details = parameters(googleCalendarEventUrl(client)!).get("details")!;
  assert.ok(details.includes("Prestation : Pack 2 + Toge + Album"));
  assert.ok(details.includes("Téléphone : 0661555601"));
  assert.ok(details.includes("Reste : 1 430,00 DH"));
  const masked = parameters(googleCalendarEventUrl({ ...client, amounts: null })!).get("details")!;
  assert.ok(!masked.includes("Reste"));
  assert.ok(masked.includes("Prestation : Pack 2 + Toge + Album"));
});

test("pas de lien sans date de soutenance valide", () => {
  assert.equal(googleCalendarEventUrl({ ...client, defenseDate: "" }), null);
});
