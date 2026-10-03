"use client";
import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import type { ClientFilters, ClientCatalog } from "@/lib/client-data";
import { fetchClientsForExport } from "./client-list-actions";

export function ClientExport({ filters, catalog }: { filters: ClientFilters; catalog: ClientCatalog }) {
  const [pending, startExport] = useTransition();
  const [error, setError] = useState("");
  // La liste est paginée : l'export récupère tous les dossiers filtrés.
  const download = () => startExport(async () => {
    setError("");
    let clients;
    try {
      clients = await fetchClientsForExport(filters);
    } catch {
      setError("Export impossible. Réessayez.");
      return;
    }
    if (!clients.length) {
      setError("Aucun client à exporter.");
      return;
    }
    const rows = clients.map((client) => {
      const supplements = new Map(client.supplements.map((item) => [item.name.toLocaleLowerCase(), item]));
      const has = (name: string) => [...supplements.keys()].some((value) => value.includes(name));
      const supplementTotal = client.supplements.reduce((sum, item) => sum + Number(item.price), 0);
      const photographer = catalog.photographers.find((item) => item.id === client.photographerId)?.name ?? "";
      const editor = catalog.editors.find((item) => item.id === client.editorId)?.name ?? "";
      return {
        "Date": client.defenseDate ? `${client.defenseDate}${client.defenseTime ? ` ${client.defenseTime}` : ""}` : "",
        "👤 Nom & prénom": client.name,
        "☎️ Téléphone": client.phone ?? "",
        "🏫 Faculté": client.facultyName ?? "",
        "👥 Binôme ?": client.isDuo ? "Oui" : "Non",
        "📦 Pack choisi": client.packName ?? "",
        "💰 Prix pack": Number(client.basePrice || 0),
        "👗 Toge": has("toge"),
        "🖊️ Perso Toge": has("perso"),
        "🖼️ Tableau": has("tableau"),
        "🪞 Miroir": has("miroir"),
        "📔 Album": has("album"),
        "📒 Photobook": has("photobook"),
        "🎈 Déco": has("déco") || has("deco"),
        "📍 Roll UP": has("roll") || has("rollup"),
        "🎁 Cadeau": has("cadeau"),
        "💰 Total Suppléments": supplementTotal,
        "🧾 Service supplémentaire": client.extraLabel ?? "",
        "💰 Montant service supplémentaire": Number(client.extraAmount || 0),
        "💸 Réduction": Number(client.discount || 0),
        "💵 Total à payer": Number(client.total || 0),
        "💳 Avance": Number(client.advance || 0),
        "📸 Photographe": photographer,
        "🎬 Monteur": editor,
        "🗂️ Statut du projet": client.status,
        "💾 Lien Drive": client.driveUrl ?? "",
        "💬 Commentaire": client.comment ?? "",
        "💶 Gain Brut": Number(client.grossProfit || 0),
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = Object.keys(rows[0] ?? {}).map((key) => ({ wch: Math.min(32, Math.max(14, key.length + 2)) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
    XLSX.writeFile(workbook, `clients-${new Date().toISOString().slice(0, 10)}.xlsx`);
  });
  return <button type="button" className="icon-action border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50" onClick={download} disabled={pending} title={error || "Exporter les clients en Excel"} aria-label="Exporter les clients en Excel">{pending ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 animate-spin fill-none stroke-current stroke-[1.8]" strokeLinecap="round"><path d="M12 3a9 9 0 1 0 9 9" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h10l4 4v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 12h8M8 16h8M8 20h5" /></svg>}<span className="sr-only">{error || "Excel"}</span></button>;
}
