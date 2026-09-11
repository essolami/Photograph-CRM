"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionIcon } from "./action-icon";
import { deleteClient, updateClientQuick } from "./actions";
import { ClientForm, DriveLinkForm } from "./client-form";
import { ClientImport } from "./client-import";
import { ClientExport } from "./client-export";
import { SettingsDrawer } from "./(dashboard)/parametres/settings-drawer";
import {
  totalPrice,
  formatDh,
  remainingPrice,
  projectStatuses,
  type ClientRecord,
  type ClientCatalog,
} from "@/lib/client-data";
const dateLabel = (value: string) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" }).format(
        new Date(`${value}T00:00:00Z`),
      )
    : "À renseigner";
export function ClientManager({
  clients,
  catalog,
  canManage,
  canEditDrive,
  canViewPrivate,
  canExport,
}: {
  clients: ClientRecord[];
  catalog: ClientCatalog;
  canManage: boolean;
  canEditDrive: boolean;
  canViewPrivate: boolean;
  canExport: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [pack, setPack] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);
  const [facultyFilter, setFacultyFilter] = useState<
    "" | "FMDC/FMPC" | "Autres"
  >("");
  const [editing, setEditing] = useState<ClientRecord | "new" | null>(null);
  const [viewing, setViewing] = useState<ClientRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [updating, startUpdate] = useTransition();
  const [optimistic, setOptimistic] = useState<Record<number, Partial<ClientRecord>>>({});
  const rollbackOptimistic = (id: number) => setOptimistic((current) => { const next = { ...current }; delete next[id]; return next; });
  const displayClients = clients.map((client) => ({ ...client, ...optimistic[client.id] }));
  const router = useRouter();
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr");
  const filtered = displayClients.filter(
    (c) =>
      normalize(`${c.name} ${c.phone ?? ""} ${c.email ?? ""}`).includes(
        normalize(query.trim()),
      ) &&
      (!status || c.status === status) &&
      (!pack || String(c.packId) === pack) &&
      (!photographer ||
        (photographer === "none"
          ? !c.photographerId
          : String(c.photographerId) === photographer)) &&
      (!from || c.defenseDate >= from) &&
      (!to || (Boolean(c.defenseDate) && c.defenseDate <= to)) &&
      (!todayOnly || c.defenseDate === new Date().toISOString().slice(0, 10)) &&
      (!facultyFilter ||
        normalize(c.facultyName ?? "") === normalize(facultyFilter)),
  );
  const packOptions = Array.from(
    new Map([
      ...catalog.packs.map((p) => [p.id, p.name] as const),
      ...displayClients
        .filter((c) => c.packId && c.packName)
        .map((c) => [c.packId!, c.packName!] as const),
    ]),
  );
  const person = (id: number | null) =>
    catalog.photographers.find((p) => p.id === id)?.name ?? "Non affecté";
  const whatsappUrl = (phone: string | null) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.startsWith("0")
      ? `212${digits.slice(1)}`
      : digits;
    return normalized.length >= 10 ? `https://wa.me/${normalized}` : null;
  };
  const photographerWhatsAppUrl = (client: ClientRecord) => {
    const photographer = catalog.photographers.find(
      (person) => person.id === client.photographerId,
    );
    const phoneUrl = whatsappUrl(photographer?.phone ?? null);
    if (!phoneUrl) return null;
    const message = [
      `Bonjour ${photographer?.name},`,
      "Voici les informations de votre séance :",
      `Client : ${client.name}`,
      `Téléphone : ${client.phone || "Non renseigné"}`,
      `Soutenance : ${dateLabel(client.defenseDate)}`,
      `Pack : ${client.packName || "Non renseigné"}`,
      `Faculté : ${client.facultyName || "Non renseignée"}`,
      `Format : ${client.isDuo ? "Binôme" : "Solo"}`,
      `Suppléments : ${client.supplements.length ? client.supplements.map((item) => item.name).join(", ") : "Aucun"}`,
      client.comment ? `Commentaire : ${client.comment}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return `${phoneUrl}?text=${encodeURIComponent(message)}`;
  };
  async function remove(c: ClientRecord) {
    if (
      !window.confirm(
        `Supprimer le dossier de ${c.name} ? Cette action est définitive.`,
      )
    )
      return;
    setDeleting(c.id);
    setError("");
    setNotice("");
    try {
      const data = new FormData();
      data.set("id", String(c.id));
      await deleteClient(data);
      setNotice("Client supprimé.");
    } catch {
      setError("Impossible de supprimer ce client.");
    } finally {
      setDeleting(null);
    }
  }
  function quickUpdate(
    client: ClientRecord,
    field: "photographerId" | "status",
    value: string,
  ) {
    setOptimistic((current) => ({
      ...current,
      [client.id]: {
        ...current[client.id],
        [field]: field === "photographerId" ? (value ? Number(value) : null) : value,
      },
    }));
    startUpdate(async () => {
      const data = new FormData();
      data.set("id", String(client.id));
      data.set(
        "photographerId",
        field === "photographerId"
          ? value
          : String(client.photographerId ?? ""),
      );
      data.set("status", field === "status" ? value : client.status);
      const result = await updateClientQuick(data);
      if (result.error) {
        rollbackOptimistic(client.id);
        setError(result.error);
      }
      else {
        setError("");
        setNotice("Mise à jour enregistrée.");
      }
    });
  }
  function applyOptimisticClient(data: FormData) {
    const id = Number(data.get("id"));
    if (!Number.isSafeInteger(id)) return;
    const current = displayClients.find((client) => client.id === id);
    if (!current) return;
    const packId = Number(data.get("packId"));
    const facultyId = Number(data.get("facultyId"));
    const isDuo = data.get("isDuo") === "true";
    const pack = catalog.packs.find((item) => item.id === packId);
    const rate = pack?.rates.find((item) => item.facultyId === facultyId);
    const chosen = catalog.supplements.filter((item) => data.getAll("supplementId").map(String).includes(String(item.id)));
    const base = rate ? (isDuo ? rate.duoPrice : rate.soloPrice) : current.basePrice;
    let total = current.total;
    try { total = totalPrice(base, chosen, String(data.get("discount") ?? "0")); } catch { /* server will report the validation error */ }
    const photographerId = data.get("photographerId") ? Number(data.get("photographerId")) : null;
    const editorId = data.get("editorId") ? Number(data.get("editorId")) : null;
    setOptimistic((patches) => ({
      ...patches,
      [id]: {
        name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? "") || null,
        email: String(data.get("email") ?? "") || null,
        defenseDate: String(data.get("defenseDate") ?? ""),
        packId: pack?.id ?? current.packId,
        facultyId: rate?.facultyId ?? current.facultyId,
        packName: pack?.name ?? current.packName,
        facultyName: rate?.name ?? current.facultyName,
        isDuo,
        basePrice: base,
        supplements: chosen,
        discount: String(data.get("discount") ?? "0"),
        total,
        advance: String(data.get("advance") ?? "0"),
        photographerId,
        editorId,
        status: String(data.get("status") ?? current.status),
        driveUrl: String(data.get("driveUrl") ?? "") || null,
        comment: String(data.get("comment") ?? "") || null,
        grossProfit: String(data.get("grossProfit") ?? ""),
      },
    }));
  }
  return (
    <>
      <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-indigo-500 uppercase">
        Gestion du studio
      </p>
      <h1 className="text-3xl font-bold sm:text-4xl">Clients</h1>
      <p className="mt-3 mb-8 text-sm text-slate-500">
        Retrouvez vos soutenances, vos prestations et l’avancement de chaque
        dossier.
      </p>
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="w-full max-w-xl flex-1 text-xs font-semibold text-slate-500">
            Rechercher
            <input
              className="field mt-2"
              type="search"
              placeholder="Rechercher par nom, email, Télephone...."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex items-end gap-3">
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                Date
              </p>
              <button
                type="button"
                className={`rounded-xl border px-3 py-3 text-xs font-semibold ${todayOnly ? "border-indigo-200 bg-indigo-600 text-white" : "border-slate-200 text-slate-600"}`}
                onClick={() => setTodayOnly((current) => !current)}
              >
                Soutenances du jour
              </button>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
                Faculté
              </p>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(
                  [
                    ["", "Toutes"],
                    ["FMDC/FMPC", "FMDC/FMPC"],
                    ["Autres", "Autres"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${facultyFilter === value ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    onClick={() => setFacultyFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {canExport && (
              <ClientExport clients={displayClients} catalog={catalog} />
            )}
            {canExport && (
              <a
                href="/api/clients/today-pdf"
                className="icon-action"
                title="Télécharger le PDF des soutenances du jour"
                aria-label="Télécharger le PDF des soutenances du jour"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-none stroke-current stroke-[1.8]"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
                </svg>
              </a>
            )}
          </div>

          {canManage && (
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => setEditing("new")}>
                Ajouter un client
              </button>
            </div>
          )}
          <button
            type="button"
            className={`icon-action ${showFilters ? "bg-indigo-100" : ""}`}
            title={showFilters ? "Masquer les filtres" : "Afficher les filtres"}
            aria-label={
              showFilters ? "Masquer les filtres" : "Afficher les filtres"
            }
            aria-expanded={showFilters}
            aria-controls="client-filters"
            onClick={() => setShowFilters((current) => !current)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-none stroke-current stroke-[1.8]"
              strokeLinecap="round"
            >
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </button>
        </div>
        <div
          id="client-filters"
          hidden={!showFilters}
          className="mt-4 space-y-4 border-t border-slate-100 pt-4"
        >
          <fieldset>
            <legend className="mb-2 text-xs font-semibold text-slate-500">
              Statut
            </legend>
            <div className="flex flex-wrap gap-2">
              <label
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${!status ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="status-filter"
                  checked={!status}
                  onChange={() => setStatus("")}
                />
                Tous
              </label>
              {projectStatuses.map((value) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold ${status === value ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500"}`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="status-filter"
                    checked={status === value}
                    onChange={() => setStatus(value)}
                  />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>
          {canManage && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs font-semibold text-slate-700">Importer des clients</p>
                <p className="mt-1 text-xs text-slate-500">Ajoutez plusieurs clients depuis un fichier Excel ou CSV.</p>
              </div>
              <ClientImport packs={catalog.packs.map((pack) => ({ id: pack.id, name: pack.name }))} onDone={() => router.refresh()} />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold text-slate-500">
              Pack
              <select
                className="field mt-2"
                value={pack}
                onChange={(e) => setPack(e.target.value)}
              >
                <option value="">Tous les packs</option>
                {packOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Photographe
              <select
                className="field mt-2"
                value={photographer}
                onChange={(e) => setPhotographer(e.target.value)}
              >
                <option value="">Tous les photographes</option>
                <option value="none">Non affecté</option>
                {catalog.photographers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Soutenance du
              <input
                type="date"
                className="field mt-2"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Au
              <input
                type="date"
                className="field mt-2"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <p role="status" className="text-sm text-slate-500">
          {filtered.length} client(s) sur {displayClients.length}
        </p>
        {(query ||
          status ||
          pack ||
          photographer ||
          from ||
          to ||
          todayOnly ||
          facultyFilter) && (
          <button
            className="action-button"
            onClick={() => {
              setQuery("");
              setStatus("");
              setPack("");
              setPhotographer("");
              setFrom("");
              setTo("");
              setTodayOnly(false);
              setFacultyFilter("");
            }}
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>
      {notice && (
        <p role="status" className="mb-3 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="client-list overflow-x-auto rounded-2xl border border-indigo-100 bg-white shadow-[0_8px_30px_rgba(79,70,229,0.06)]">
        <table className="studio-table w-full text-left text-sm">
          <caption className="sr-only">Liste des clients</caption>
          <thead className="border-b border-indigo-100 bg-indigo-50/80 text-indigo-800">
            <tr>
              {[
                "Client",
                "Soutenance",
                "Prestation",
                "Suppléments",
                "Photographe",

                "Total",
                "Actions",
              ].map((label) => (
                <th scope="col" key={label} className="px-4 py-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-b border-slate-100 transition hover:bg-indigo-50/40"
                onClick={() => setViewing(c)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setViewing(c);
                }}
                tabIndex={0}
                aria-label={`Voir les détails de ${c.name}`}
              >
                <td className="px-4">
                  <p className="max-w-44 truncate font-bold" title={c.name}>
                    {c.name}
                  </p>
                  {canViewPrivate && c.phone && (
                    <a
                      className="mt-1 block text-xs text-slate-500"
                      href={`tel:${c.phone}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {c.phone}
                    </a>
                  )}
                </td>
                <td className="px-4 whitespace-nowrap">
                  {dateLabel(c.defenseDate)}
                </td>
                <td className="px-4" onClick={(event) => event.stopPropagation()}>
                  <p
                    className="max-w-32 truncate font-semibold"
                    title={c.packName ?? "À renseigner"}
                  >
                    {c.packName ?? "À renseigner"}
                  </p>
                  <p
                    className="mt-1 max-w-36 truncate text-xs text-slate-500"
                    title={`${c.facultyName ?? "—"} · ${c.isDuo ? "Binôme" : "Solo"}`}
                  >
                    {c.facultyName ?? "—"} · {c.isDuo ? "Binôme" : "Solo"}
                  </p>
                </td>
                <td className="px-4" onClick={(event) => event.stopPropagation()}>
                  {c.supplements.length > 0 ? (
                    <span
                      className="block max-w-36 truncate text-xs font-semibold text-indigo-600"
                      title={c.supplements
                        .map((supplement) => supplement.name)
                        .join(", ")}
                    >
                      {c.supplements
                        .map((supplement) => supplement.name)
                        .join(", ")}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Aucun</span>
                  )}
                </td>
                <td className="px-4" onClick={(event) => event.stopPropagation()}>
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Photographe de ${c.name}`}
                        disabled={updating}
                        value={c.photographerId ?? ""}
                        onChange={(event) =>
                          quickUpdate(c, "photographerId", event.target.value)
                        }
                        className="table-select photographer-select"
                      >
                        <option value="">Non affecté</option>
                        {catalog.photographers
                          .filter(
                            (p) => p.isActive || p.id === c.photographerId,
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                      {photographerWhatsAppUrl(c) && (
                        <a
                          href={photographerWhatsAppUrl(c)!}
                          target="_blank"
                          rel="noreferrer"
                          className="icon-action bg-emerald-50 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-100"
                          title="Envoyer les informations au photographe"
                          aria-label={`Envoyer les informations de ${c.name} au photographe`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ActionIcon name="whatsapp" />
                        </a>
                      )}
                    </div>
                  ) : (
                    person(c.photographerId)
                  )}
                </td>

                <td className="px-4 font-bold whitespace-nowrap tabular-nums">
                  {canViewPrivate ? (
                    <>
                      <p>{formatDh(c.total)}</p>
                      {c.total.trim() && c.advance.trim() ? (
                        <p className={`mt-1 text-xs ${Number(c.advance) >= Number(c.total) ? "text-emerald-600" : "text-amber-600"}`}>
                          {Number(c.advance) >= Number(c.total) ? "Soldé" : `Reste ${formatDh(remainingPrice(c.total, c.advance))}`}
                        </p>
                      ) : null}
                    </>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4" onClick={(event) => event.stopPropagation()}>
                  <div className="flex gap-1">
                    {canViewPrivate && whatsappUrl(c.phone) && (
                      <a
                        className="icon-action bg-emerald-50 text-emerald-600 hover:border-emerald-200 hover:bg-emerald-100"
                        href={whatsappUrl(c.phone)!}
                        target="_blank"
                        rel="noreferrer"
                        title="Ouvrir WhatsApp"
                        aria-label={`Ouvrir WhatsApp pour ${c.name}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <ActionIcon name="whatsapp" />
                      </a>
                    )}
                    <button
                      className="icon-action"
                      title={canManage ? "Modifier" : canEditDrive ? "Modifier le lien Drive" : "Consulter"}
                      aria-label={`${canManage ? "Modifier" : canEditDrive ? "Modifier le lien Drive" : "Consulter"} ${c.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditing(c);
                      }}
                      aria-haspopup="dialog"
                    >
                      <ActionIcon name={canManage || canEditDrive ? "edit" : "view"} />
                    </button>
                    {canManage && (
                      <button
                        className="icon-action icon-action-danger"
                        title="Supprimer"
                        aria-label={`Supprimer ${c.name}`}
                        disabled={deleting !== null}
                        onClick={(event) => {
                          event.stopPropagation();
                          remove(c);
                        }}
                      >
                        <ActionIcon
                          name={deleting === c.id ? "loading" : "delete"}
                        />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-500">
                  {displayClients.length
                    ? "Aucun client ne correspond aux filtres."
                    : "Aucun client enregistré."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {viewing && (
        <SettingsDrawer
          compact
          title={viewing.name}
          onClose={() => setViewing(null)}
        >
          <dl className="grid gap-x-5 gap-y-0 sm:grid-cols-2">
            {Object.entries({
              "Nom complet": viewing.name,
              Téléphone: canViewPrivate ? viewing.phone : null,
              "E-mail": canViewPrivate ? viewing.email : null,
              Soutenance: dateLabel(viewing.defenseDate),
              Pack: viewing.packName,
              Faculté: viewing.facultyName,
              Binôme: viewing.isDuo ? "Oui" : "Non",
              Suppléments: viewing.supplements.length
                ? viewing.supplements.map((s) => `${s.name} (${formatDh(s.price)})`).join(", ")
                : "Aucun",
              "Total à payer": canViewPrivate ? formatDh(viewing.total) : null,
              "Avance versée": canViewPrivate ? formatDh(viewing.advance) : null,
              "Reste à payer": canViewPrivate && viewing.total.trim() && viewing.advance.trim()
                ? formatDh(remainingPrice(viewing.total, viewing.advance))
                : null,
              Réduction: canViewPrivate ? formatDh(viewing.discount) : null,
              Photographe: person(viewing.photographerId),
              Monteur: catalog.editors.find((p) => p.id === viewing.editorId)?.name,
              Statut: viewing.status,
              "Lien Drive": viewing.driveUrl,
              Commentaire: viewing.comment,
              "Gain brut": canViewPrivate && viewing.grossProfit ? formatDh(viewing.grossProfit) : null,
            }).filter(([label]) => canViewPrivate || !["Téléphone", "E-mail", "Total à payer", "Avance versée", "Reste à payer", "Réduction", "Gain brut"].includes(label)).map(([label, value]) => (
              <div
                key={label}
                className={`flex min-h-10 items-baseline justify-between gap-3 border-b border-slate-100 py-2 ${label === "Suppléments" || label === "Commentaire" ? "sm:col-span-2 flex-col items-start gap-1" : ""}`}
              >
                <dt className="shrink-0 text-[11px] font-semibold text-slate-500">{label}</dt>
                <dd className={`min-w-0 text-sm font-semibold break-words whitespace-pre-wrap text-slate-900 ${label === "Suppléments" || label === "Commentaire" ? "w-full text-left" : "text-right"}`}>
                  {value || "—"}
                </dd>
              </div>
            ))}
          </dl>
          {canViewPrivate && (
            <a
              href={`/api/clients/${viewing.id}/quote`}
              className="btn-secondary mt-4 flex w-full items-center justify-center"
              download
            >
              Télécharger le devis (PDF)
            </a>
          )}
          {canManage && (
            <button
              type="button"
              className="btn-primary mt-4 w-full"
              onClick={() => {
                setEditing(viewing);
                setViewing(null);
              }}
            >
              Modifier ce dossier
            </button>
          )}
        </SettingsDrawer>
      )}
      {editing && (
        <SettingsDrawer
          wide
          compact
          title={editing === "new" ? "Ajouter un client" : editing.name}
          onClose={() => setEditing(null)}
        >
          {canManage ? (
            <ClientForm
              client={editing === "new" ? undefined : editing}
              catalog={catalog}
              onDone={() => setEditing(null)}
              onOptimistic={editing === "new" ? undefined : applyOptimisticClient}
              onError={editing === "new" ? undefined : () => rollbackOptimistic(editing.id)}
            />
          ) : canEditDrive && editing !== "new" ? (
            <DriveLinkForm client={editing} onDone={() => setEditing(null)} />
          ) : (
            editing !== "new" && (
              <dl className="space-y-4">
                {Object.entries({
                  "Nom complet": editing.name,
                  Téléphone: editing.phone,
                  "E-mail": editing.email,
                  Soutenance: dateLabel(editing.defenseDate),
                  Pack: editing.packName,
                  Faculté: editing.facultyName,
                  Binôme: editing.isDuo ? "Oui" : "Non",
                  Suppléments: editing.supplements
                    .map((s) => `${s.name} (${formatDh(s.price)})`)
                    .join(", "),
                  "Total à payer": formatDh(editing.total),
                  "Avance versée": formatDh(editing.advance),
                  "Reste à payer": editing.total.trim() && editing.advance.trim()
                    ? formatDh(remainingPrice(editing.total, editing.advance))
                    : null,
                  Réduction: formatDh(editing.discount),
                  Photographe: person(editing.photographerId),
                  Monteur: catalog.editors.find(
                    (p) => p.id === editing.editorId,
                  )?.name,
                  Statut: editing.status,
                  Commentaire: editing.comment,
                  "Gain brut": editing.grossProfit
                    ? formatDh(editing.grossProfit)
                    : "—",
                }).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="mt-1 text-sm whitespace-pre-wrap">
                      {value || "—"}
                    </dd>
                  </div>
                ))}
                {editing.driveUrl && (
                  <div>
                    <dt className="text-xs text-slate-500">Lien Drive</dt>
                    <dd>
                      <a
                        href={editing.driveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-indigo-600"
                      >
                        Ouvrir le dossier Drive ↗
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            )
          )}
        </SettingsDrawer>
      )}
    </>
  );
}
