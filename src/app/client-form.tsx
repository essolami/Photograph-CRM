"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { createClient, updateClient, updateClientDrive } from "./actions";
import {
  cents,
  formatDh,
  totalPrice,
  remainingPrice,
  projectStatuses,
  type ClientRecord,
  type ClientCatalog,
} from "@/lib/client-data";
export function ClientForm({
  client,
  catalog,
  onDone,
  onOptimistic,
  onError,
}: {
  client?: ClientRecord;
  catalog: ClientCatalog;
  onDone: () => void;
  onOptimistic?: (data: FormData) => void;
  onError?: () => void;
}) {
  const [packId, setPackId] = useState(String(client?.packId ?? ""));
  const [facultyId, setFacultyId] = useState(String(client?.facultyId ?? ""));
  const [isDuo, setIsDuo] = useState(client?.isDuo ?? false);
  const [advance, setAdvance] = useState(client?.advance ?? "0");
  const [discount, setDiscount] = useState(client?.discount ?? "0");
  const [selected, setSelected] = useState(
    client?.supplements.map((s) => s.id) ?? [],
  );
  const formRef = useRef<HTMLFormElement>(null);
  const submittedValues = useRef<Record<string, string>>({});
  const [state, action, pending] = useActionState(
    async (previous: { error?: string; success?: boolean }, data: FormData) => {
      const result = await (client ? updateClient : createClient)(
        previous,
        data,
      );
      if (result.success) onDone();
      else onError?.();
      return result;
    },
    {},
  );
  useEffect(() => {
    if (!state.error || !formRef.current) return;
    for (const element of Array.from(formRef.current.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) continue;
      const saved = submittedValues.current[element.name];
      if (saved !== undefined && element.type !== "checkbox" && element.type !== "radio") element.value = saved;
    }
  }, [state]);
  const pack = catalog.packs.find((p) => String(p.id) === packId);
  const rate = pack?.rates.find((r) => String(r.facultyId) === facultyId);
  const sameRate =
    client &&
    String(client.packId) === packId &&
    String(client.facultyId) === facultyId &&
    client.isDuo === isDuo;
  const base = sameRate
    ? client.basePrice
    : rate
      ? isDuo
        ? rate.duoPrice
        : rate.soloPrice
      : null;
  const supplements = [
    ...catalog.supplements.map(
      (s) => client?.supplements.find((old) => old.id === s.id) ?? s,
    ),
    ...(client?.supplements.filter(
      (s) => !catalog.supplements.some((current) => current.id === s.id),
    ) ?? []),
  ];
  const chosen = supplements.filter((s) => selected.includes(s.id));
  let remaining: string | null = null;
  let total: string | null = null,
    calculationError = "";
  if (base !== null) {
    try {
      total = totalPrice(base, chosen, discount || "0");
      remaining = remainingPrice(total, advance || "0");
    } catch (error) {
      calculationError = (error as Error).message;
    }
  }
  const field = (
    name: string,
    label: string,
    type = "text",
    value?: string | null,
    required = false,
  ) => (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="field mt-2"
        name={name}
        type={type}
        defaultValue={value ?? ""}
        required={required}
        maxLength={name === "name" ? 120 : name === "phone" ? 30 : undefined}
      />
    </label>
  );
  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(event) => {
        onOptimistic?.(new FormData(event.currentTarget));
        const values: Record<string, string> = {};
        for (const [key, value] of new FormData(event.currentTarget).entries()) {
          if (typeof value === "string") values[key] = value;
        }
        submittedValues.current = values;
      }}
      className="client-form space-y-4"
    >
      {client && <input type="hidden" name="id" value={client.id} />}
      <fieldset
        disabled={pending}
        className="client-section grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <legend className="mb-3 font-bold text-indigo-600">
          Coordonnées et soutenance
        </legend>
        {field("name", "Nom complet", "text", client?.name, true)}
        {field("email", "E-mail (facultatif)", "email", client?.email)}
        {field("phone", "Téléphone", "tel", client?.phone, true)}
        {field(
          "defenseDate",
          "Date de soutenance",
          "date",
          client?.defenseDate,
          true,
        )}
      </fieldset>
      <fieldset
        disabled={pending}
        className="client-section grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <legend className="mb-3 font-bold text-indigo-600">Prestation</legend>
        <label className="block text-sm font-semibold">
          Pack
          <select
            name="packId"
            className="field mt-2"
            required
            value={packId}
            onChange={(e) => {
              setPackId(e.target.value);
              setFacultyId("");
            }}
          >
            <option value="">Choisir un pack</option>
            {catalog.packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            {client?.packId &&
              !catalog.packs.some((p) => p.id === client.packId) && (
                <option value={client.packId}>
                  {client.packName} (archivé)
                </option>
              )}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Faculté
          <select
            name="facultyId"
            className="field mt-2"
            required
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
          >
            <option value="">Choisir une faculté</option>
            {pack?.rates.map((r) => (
              <option key={r.facultyId} value={r.facultyId}>
                {r.name}
              </option>
            ))}
            {client?.facultyId &&
              String(client.packId) === packId &&
              !pack?.rates.some((r) => r.facultyId === client.facultyId) && (
                <option value={client.facultyId}>
                  {client.facultyName} (tarif enregistré)
                </option>
              )}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Binôme
          <select
            name="isDuo"
            className="field mt-2"
            value={String(isDuo)}
            onChange={(e) => setIsDuo(e.target.value === "true")}
          >
            <option value="false">Solo</option>
            <option value="true">Binôme</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-semibold">Suppléments</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {supplements.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="supplementId"
                  value={s.id}
                  checked={selected.includes(s.id)}
                  onChange={(e) =>
                    setSelected((current) =>
                      e.target.checked
                        ? [...current, s.id]
                        : current.filter((id) => id !== s.id),
                    )
                  }
                />
                <span className="flex-1">{s.name}</span>
                <span className="font-bold">{formatDh(s.price)}</span>
              </label>
            ))}
          </div>
          {!supplements.length && (
            <p className="text-sm text-slate-500">
              Aucun supplément disponible.
            </p>
          )}
        </div>
      </fieldset>
      <fieldset
        disabled={pending}
        className="client-section grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <legend className="mb-3 font-bold text-indigo-600">
          Équipe et suivi
        </legend>
        {(
          [
            [
              "photographerId",
              "Photographe",
              catalog.photographers,
              client?.photographerId,
            ],
            ["editorId", "Monteur", catalog.editors, client?.editorId],
          ] as const
        ).map(([name, label, people, selectedId]) => (
          <label key={name} className="block text-sm font-semibold">
            {label}
            <select
              className="field mt-2"
              name={name}
              defaultValue={selectedId ?? ""}
            >
              <option value="">Non affecté</option>
              {people
                .filter((p) => p.isActive || p.id === selectedId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {!p.isActive && " (inactif)"}
                  </option>
                ))}
            </select>
          </label>
        ))}
        <label className="block text-sm font-semibold">
          Statut du projet
          <select
            className="field mt-2"
            name="status"
            defaultValue={client?.status ?? "En cours"}
          >
            {projectStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {field("driveUrl", "Lien Google Drive", "url", client?.driveUrl)}
        <label className="block text-sm font-semibold sm:col-span-2">
          Commentaire
          <textarea
            name="comment"
            className="field mt-2"
            rows={2}
            maxLength={5000}
            defaultValue={client?.comment ?? ""}
          />
        </label>
      </fieldset>
      <fieldset
        disabled={pending}
        className="client-section grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <legend className="mb-3 font-bold text-indigo-600">Montants</legend>
        <label className="block text-sm font-semibold">
          Réduction (DH)
          <input
            className="field mt-2"
            name="discount"
            type="number"
            min="0"
            max="99999999.99"
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold">
          Avance versée (DH)
          <input
            className="field mt-2"
            name="advance"
            type="number"
            min="0"
            max={total ?? "99999999.99"}
            step="0.01"
            value={advance}
            onChange={(event) => setAdvance(event.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold">
          Gain brut (DH) — saisie manuelle
          <input
            className="field mt-2"
            name="grossProfit"
            type="number"
            min="0"
            max="99999999.99"
            step="0.01"
            defaultValue={client?.grossProfit}
          />
        </label>
      </fieldset>
      <section
        className="overflow-hidden rounded-2xl border border-indigo-200 bg-white"
        aria-label="Détail du montant"
        aria-live="polite"
      >
        <div className="border-b border-indigo-100 bg-indigo-50 px-5 py-4">
          <h3 className="font-bold text-indigo-950">
            Récapitulatif de la prestation
          </h3>
          <p className="mt-1 text-xs text-indigo-600">
            Tous les montants sont en dirhams.
          </p>
        </div>
        <dl className="space-y-3 p-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt>
              {pack?.name ?? client?.packName ?? "Pack"} ·{" "}
              {rate?.name ?? client?.facultyName ?? "Faculté"} ·{" "}
              {isDuo ? "Binôme" : "Solo"}
            </dt>
            <dd className="shrink-0 font-bold">
              {base === null ? "À sélectionner" : formatDh(base)}
            </dd>
          </div>
          {chosen.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-4 text-slate-600"
            >
              <dt>{item.name}</dt>
              <dd className="shrink-0 font-semibold">{formatDh(item.price)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-slate-100 pt-3">
            <dt>Sous-total</dt>
            <dd className="font-bold">
              {base === null
                ? "—"
                : formatDh(
                    (
                      (cents(base) +
                        chosen.reduce((sum, s) => sum + cents(s.price), 0)) /
                      100
                    ).toFixed(2),
                  )}
            </dd>
          </div>
          <div className="flex justify-between text-emerald-700">
            <dt>Réduction</dt>
            <dd className="font-semibold">− {formatDh(discount || "0")}</dd>
          </div>
          <div className="flex justify-between text-indigo-700">
            <dt>Avance versée</dt>
            <dd className="font-semibold">{formatDh(advance || "0")}</dd>
          </div>
        </dl>
        <div className="grid grid-cols-1 gap-4 bg-indigo-950 p-5 text-white sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-indigo-200">
              Total à payer après réduction
            </p>
            <p className="mt-1 text-xl font-bold">
              {total === null ? "—" : formatDh(total)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-xs font-semibold text-indigo-200">
              Reste à payer
            </p>
            <p className="mt-1 text-2xl font-extrabold text-white">
              {remaining === null ? "—" : formatDh(remaining)}
            </p>
          </div>
        </div>
        {calculationError && (
          <p role="alert" className="bg-red-50 px-5 py-3 text-sm text-red-600">
            {calculationError}
          </p>
        )}
      </section>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={onDone}
          disabled={pending}
        >
          Annuler
        </button>
        <button
          className="btn-primary disabled:opacity-50"
          disabled={pending || total === null || remaining === null}
        >
          {pending
            ? "Enregistrement…"
            : client
              ? "Enregistrer"
              : "Ajouter le client"}
        </button>
      </div>
    </form>
  );
}

export function DriveLinkForm({
  client,
  onDone,
}: {
  client: ClientRecord;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(updateClientDrive, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={client.id} />
      <div>
        <p className="text-sm font-semibold text-slate-800">Lien Google Drive</p>
        <p className="mt-1 text-xs text-slate-500">Ajoutez le lien du montage terminé.</p>
        <input className="field mt-2" name="driveUrl" type="url" defaultValue={client.driveUrl ?? ""} placeholder="https://drive.google.com/..." />
      </div>
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onDone} disabled={pending}>Annuler</button>
        <button className="btn-primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
      </div>
    </form>
  );
}
