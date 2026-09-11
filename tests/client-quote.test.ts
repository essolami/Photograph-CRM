import assert from "node:assert/strict";
import test from "node:test";
import { inflateSync } from "node:zlib";
import { createClientQuote, type ClientQuote } from "../src/lib/client-quote";

const client: ClientQuote = {
  id: 42,
  name: "Sara Rayane",
  phone: "0661555601",
  email: "sara@example.com",
  defenseDate: new Date("2026-08-04T00:00:00Z"),
  defenseTime: "17:30",
  facultyName: "UIASS",
  packName: "Pack 3",
  isDuo: false,
  basePrice: "3000",
  supplements: [
    { id: 1, name: "Toge", price: "400" },
    { id: 2, name: "Couverture et copie", price: "159" },
  ],
  discount: "100",
  total: "3459",
  advance: "1500",
};

// Read the text operands from PDFKit's compressed page content streams.
function pdfText(pdf: Buffer) {
  return [
    ...pdf.toString("latin1").matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g),
  ]
    .map((match) => inflateSync(Buffer.from(match[1], "latin1")).toString())
    .flatMap((stream) =>
      [...stream.matchAll(/<([0-9a-f]+)>/gi)].map((match) =>
        Buffer.from(match[1], "hex").toString("latin1"),
      ),
    )
    .join("");
}

test("quote contains saved order, appointment, discount and payment amounts", async () => {
  const pdf = await createClientQuote(client);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  const text = pdfText(pdf);
  for (const value of [
    "Sara Rayane",
    "0661555601",
    "sara@example.com",
    "2026",
    "17:30",
    "UIASS",
    "Solo",
    "Pack 3",
    "Toge",
    "Couverture et copie",
    "3.000,00 DH",
    "400,00 DH",
    "159,00 DH",
    "100,00 DH",
    "3.459,00 DH",
    "1.500,00 DH",
    "1.959,00 DH",
  ])
    assert.ok(text.includes(value), `Missing ${value}`);
  assert.equal(
    (pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length,
    1,
  );
});

test("quote supports missing appointment, no supplements and fully paid orders", async () => {
  const text = pdfText(
    await createClientQuote({
      ...client,
      defenseDate: null,
      defenseTime: null,
      phone: null,
      email: null,
      supplements: [],
      discount: "0",
      total: "3000",
      advance: "3000",
      isDuo: true,
    }),
  );
  assert.ok(text.includes("confirmer"));
  assert.ok(text.includes("Aucun suppl"));
  assert.ok(text.includes("0,00 DH"));
  assert.ok(!text.includes("null"));
});

test("long orders retain every supplement and balance across pages", async () => {
  const pdf = await createClientQuote({
    ...client,
    supplements: Array.from({ length: 60 }, (_, id) => ({
      id,
      name: `Option ${id} fin`,
      price: "10",
    })),
  });
  const text = pdfText(pdf);
  for (let id = 0; id < 60; id++) assert.ok(text.includes(`Option ${id} fin`));
  assert.ok(text.includes("1.959,00 DH"));
  assert.ok(
    (pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length > 1,
  );
});
