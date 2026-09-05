"use client";

import { Fragment, useState } from "react";
import { ActionIcon } from "../action-icon";
import { deleteSetting } from "./actions";
import { SettingsDrawer } from "./settings-drawer";
import { SettingForm } from "./setting-form";
import { sections, type Section } from "./config";

type Row = {
  id: number;
  name: string;
  phone?: string | null;
  isActive: boolean;
  price?: string;
  priceRows: {
    id: number;
    name: string;
    isActive: boolean;
    soloPrice?: string;
    duoPrice?: string;
  }[];
};
const amount = (value?: string) =>
  value === undefined
    ? "À renseigner"
    : new Intl.NumberFormat("fr-MA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value));

export function SettingsTable({
  section,
  records,
  newPriceRows,
}: {
  section: Section;
  records: Row[];
  newPriceRows: Row["priceRows"];
}) {
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  async function remove(record: Row) {
    if (
      !window.confirm(
        `Supprimer « ${record.name} » ?${section === "packs" ? " Les tarifs de ce pack seront également supprimés." : ""} Cette action est définitive.`,
      )
    )
      return;
    setDeletingId(record.id);
    setDeleteError("");
    setNotice("");
    try {
      const result = await deleteSetting(section, record.id);
      if (result.error) setDeleteError(result.error);
      else setNotice(result.success ?? "Élément supprimé.");
    } catch {
      setDeleteError("La suppression a échoué. Réessayez.");
    } finally {
      setDeletingId(null);
    }
  }

  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr");
  const filtered = records.filter(
    (record) =>
      normalize(record.name).includes(normalize(query.trim())) &&
      (status === "all" || record.isActive === (status === "active")),
  );

  const hasRates = section === "packs";
  const columns = hasRates
    ? 6
    : section === "supplements"
      ? 4
      : section === "photographes"
        ? 4
        : 3;
  return (
    <>
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.02)]">
        <label className="min-w-48 flex-1 text-xs font-semibold text-slate-500">
          Rechercher
          <input
            type="search"
            className="field mt-2"
            placeholder="Rechercher par nom…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Statut
          <select
            className="field mt-2"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </label>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setNotice("");
            setEditing("new");
          }}
        >
          + Ajouter
        </button>
      </div>
      <p className="mb-3 text-sm text-slate-500" role="status">
        {filtered.length} élément(s) sur {records.length}
      </p>
      {deleteError && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {deleteError}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.025)]">
        <table className="studio-table w-full text-left text-sm">
          <caption className="sr-only">
            {sections[section].title} enregistrés
          </caption>
          <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">
                Nom
              </th>
              {hasRates && (
                <>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Faculté
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    Solo (DH)
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">
                    Binôme (DH)
                  </th>
                </>
              )}
              {section === "supplements" && (
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Tarif (DH)
                </th>
              )}
              {section === "photographes" && (
                <th scope="col" className="px-5 py-3 font-medium">
                  Téléphone
                </th>
              )}
              <th scope="col" className="px-5 py-3 font-medium">
                Statut
              </th>
              <th scope="col" className="px-5 py-3 text-right font-medium">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => {
              const rates =
                hasRates && record.priceRows.length ? record.priceRows : [null];
              return (
                <Fragment key={record.id}>
                  {rates.map((rate, index) => (
                    <tr
                      key={rate?.id ?? "base"}
                      className="border-b border-slate-100 hover:bg-slate-50/60"
                    >
                      {index === 0 && (
                        <th
                          scope="rowgroup"
                          rowSpan={rates.length}
                          className="px-5 py-4 align-top font-semibold text-slate-900"
                        >
                          {record.name}
                        </th>
                      )}
                      {hasRates && (
                        <>
                          <td className="px-5 py-4">
                            {rate?.name ?? "Aucun tarif"}
                            {rate && !rate.isActive && (
                              <span className="ml-2 text-xs text-slate-400">
                                Inactif
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap tabular-nums">
                            {rate ? amount(rate.soloPrice) : "—"}
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap tabular-nums">
                            {rate ? amount(rate.duoPrice) : "—"}
                          </td>
                        </>
                      )}
                      {section === "supplements" && (
                        <td className="px-5 py-4 text-right whitespace-nowrap tabular-nums">
                          {amount(record.price)}
                        </td>
                      )}
                      {section === "photographes" && (
                        <td className="px-5 py-4 text-slate-600">
                          {record.phone || "Non renseigné"}
                        </td>
                      )}
                      {index === 0 && (
                        <>
                          <td
                            rowSpan={rates.length}
                            className="px-5 py-4 align-top"
                          >
                            <span
                              className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${record.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                            >
                              {record.isActive ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td
                            rowSpan={rates.length}
                            className="px-5 py-4 text-right align-top"
                          >
                            <button
                              type="button"
                              className="icon-action"
                              title="Modifier"
                              aria-label={`Modifier ${record.name}`}
                              aria-haspopup="dialog"
                              onClick={() => {
                                setNotice("");
                                setEditing(record);
                              }}
                            >
                              <ActionIcon name="edit" />
                            </button>
                            <button
                              type="button"
                              disabled={deletingId !== null}
                              onClick={() => remove(record)}
                              aria-label={`Supprimer ${record.name}`}
                              className="icon-action icon-action-danger ml-2"
                              title="Supprimer"
                            >
                              <ActionIcon
                                name={
                                  deletingId === record.id
                                    ? "loading"
                                    : "delete"
                                }
                              />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={columns}
                  className="px-5 py-10 text-center text-slate-500"
                >
                  {records.length
                    ? "Aucun résultat. Modifiez vos filtres."
                    : "Aucun élément enregistré. Cliquez sur Ajouter pour commencer."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editing !== null && (
        <SettingsDrawer
          title={
            editing === "new"
              ? `Ajouter · ${sections[section].title}`
              : `Modifier ${editing.name}`
          }
          onClose={() => setEditing(null)}
        >
          <SettingForm
            section={section}
            record={editing === "new" ? undefined : editing}
            priceRows={editing === "new" ? newPriceRows : editing.priceRows}

            onSaved={() => {
              setEditing(null);
              setNotice("Enregistrement effectué.");
            }}
          />
        </SettingsDrawer>
      )}
    </>
  );
}
