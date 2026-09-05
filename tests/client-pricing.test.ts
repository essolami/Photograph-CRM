import assert from "node:assert/strict";
import test from "node:test";
import { cents, totalPrice, remainingPrice } from "../src/lib/client-data";

test("calcul solo et binôme avec suppléments et réduction", () => {
  const extras = [
    { id: 1, name: "Toge", price: "400" },
    { id: 2, name: "Perso toge", price: "30" },
  ];
  assert.equal(totalPrice("1400", extras, "100"), "1730.00");
  assert.equal(totalPrice("2100", extras, "100"), "2430.00");
});
test("centimes exacts et virgule française", () => {
  assert.equal(cents("12,35"), 1235);
  assert.equal(
    totalPrice("0.10", [{ id: 1, name: "Option", price: "0.20" }], "0"),
    "0.30",
  );
  assert.equal(totalPrice("1400", [], "1400"), "0.00");
});
test("rejette montants invalides, réduction excessive et dépassement", () => {
  for (const invalid of [
    "-1",
    "NaN",
    "Infinity",
    "1.001",
    "1e2",
    "",
    "100000000",
  ])
    assert.throws(() => cents(invalid));
  assert.throws(() => totalPrice("100", [], "100.01"));
  assert.throws(() =>
    totalPrice("99999999.99", [{ id: 1, name: "Option", price: "0.01" }], "0"),
  );
});

test("avance et solde, avec règlement complet et contrôle du trop-perçu", () => {
  assert.equal(remainingPrice("1730", "500"), "1230.00");
  assert.equal(remainingPrice("1730", "0"), "1730.00");
  assert.equal(remainingPrice("1730", "1730"), "0.00");
  assert.equal(remainingPrice("0.30", "0.10"), "0.20");
  assert.throws(() => remainingPrice("100", "100.01"));
  assert.throws(() => remainingPrice("100", "-1"));
});
