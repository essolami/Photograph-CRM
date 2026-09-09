"use client";
import * as XLSX from "xlsx";
import type { ClientRecord, ClientCatalog } from "@/lib/client-data";

export function ClientExport({ clients, catalog }: { clients: ClientRecord[]; catalog: ClientCatalog }) {
  function download() {
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
  }
  return <button type="button" className="icon-action border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" onClick={download} title="Exporter les clients en Excel" aria-label="Exporter les clients en Excel"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h10l4 4v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 12h8M8 16h8M8 20h5" /></svg><span className="sr-only">Excel</span></button>;
}
