"use client";
import { useActionState, useState } from "react";
import { saveSetting } from "./actions";
import { type Section } from "./config";
type PriceRow = {
  id: number;
  name: string;
  isActive: boolean;
  soloPrice?: string;
  duoPrice?: string;
};
export function SettingForm({
  section,
  record,
  priceRows = [],
  onSaved,
}: {
  section: Section;
  record?: {
    id: number;
    name?: string;
    phone?: string | null;
    isActive?: boolean;
    price?: string;
  };
  priceRows?: PriceRow[];
  onSaved?: () => void;
}) {
  const [rows, setRows] = useState(() =>
    priceRows.length
      ? priceRows.map((row) => ({ ...row, key: `existing_${row.id}` }))
      : [
          {
            key: "initial",
            id: 0,
            name: "",
            isActive: true,
            soloPrice: "",
            duoPrice: "",
          },
        ],
  );
  const [state, action, pending] = useActionState(
    async (
      previous: Awaited<ReturnType<typeof saveSetting>>,
      data: FormData,
    ) => {
      const result = await saveSetting(previous, data);
      if (result.success) onSaved?.();
      return result;
    },
    {},
  );
  return (
    <form
      action={action}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="id" value={record?.id ?? ""} />
      <label className="block text-sm font-medium">
        {section === "packs" ? "Nom du pack" : "Nom"}
        <input
          className="field mt-2"
          name="name"
          required
          maxLength={120}
          defaultValue={record?.name}
          placeholder={section === "packs" ? "Ex. Pack 1" : "Saisissez un nom"}
        />
      </label>
      {(section === "photographes" || section === "monteurs") && (
        <label className="mt-4 block text-sm font-medium">
          Téléphone WhatsApp
          <input
            className="field mt-2"
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={record?.phone ?? ""}
            placeholder="Ex. +212 600 000 000"
          />
        </label>
      )}
      {section === "packs" && (
        <fieldset className="mt-5">
          <legend className="font-semibold">Facultés et tarifs</legend>
          <p className="mt-1 mb-3 text-sm text-slate-500">
            Ajoutez vos facultés et leurs tarifs. Tout sera enregistré avec le
            pack.
          </p>
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.key} className="rounded-xl bg-slate-50 p-3">
                <div className="mb-3 flex items-end gap-2">
                  <label className="flex-1 text-sm font-medium">
                    Nom de la faculté
                    <input
                      className="field mt-1"
                      name={`facultyName_${row.key}`}
                      required
                      maxLength={120}
                      defaultValue={row.name}
                      placeholder="Ex. FMDC/FMPC"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={pending || rows.length === 1}
                    className="action-button disabled:cursor-default disabled:opacity-30"
                    aria-label={`Retirer ${row.name || "la faculté"}`}
                    onClick={() =>
                      setRows((current) =>
                        current.length > 1
                          ? current.filter((item) => item.key !== row.key)
                          : current,
                      )
                    }
                  >
                    Retirer
                  </button>
                </div>
                <input type="hidden" name="rowKey" value={row.key} />
                <div className="grid grid-cols-2 gap-3">
                  {(["soloPrice", "duoPrice"] as const).map((key) => (
                    <label key={key} className="text-sm">
                      {key === "soloPrice" ? "Solo (DH)" : "Binôme (DH)"}
                      <input
                        className="field mt-1"
                        name={`${key}_${row.key}`}
                        type="number"
                        min="0"
                        max="99999999.99"
                        step="0.01"
                        required
                        defaultValue={row[key]}
                        placeholder="À renseigner"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-secondary mt-4"
            disabled={pending || rows.length >= 100}
            onClick={() =>
              setRows((current) => [
                ...current,
                {
                  key: crypto.randomUUID(),
                  id: 0,
                  name: "",
                  isActive: true,
                  soloPrice: "",
                  duoPrice: "",
                },
              ])
            }
          >
            + Ajouter une faculté
          </button>
        </fieldset>
      )}
      {section === "supplements" && (
        <label className="mt-3 block text-sm font-medium">
          Tarif (DH)
          <input
            className="field mt-2"
            name="price"
            type="number"
            min="0"
            max="99999999.99"
            step="0.01"
            required
            defaultValue={record?.price}
          />
        </label>
      )}
      <div className="mt-5 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={record?.isActive ?? section !== "supplements"}
          />
          Actif
        </label>
        <button className="btn-primary disabled:opacity-50" disabled={pending}>
          {pending ? "Enregistrement…" : record ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {state.success}
        </p>
      )}
    </form>
  );
}
