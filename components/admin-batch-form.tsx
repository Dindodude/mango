"use client";

import { useFormState } from "react-dom";
import { saveBatch, type AdminActionState } from "@/app/actions";
import { batchStatuses } from "@/lib/constants";
import { AdminFormButton } from "@/components/admin-form-button";

const initialState: AdminActionState = { ok: false, message: "" };

function displayDate(value?: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleString("en-US", { month: "long", timeZone: "UTC" })} ${date.getUTCDate()} ${date.getUTCFullYear()}`;
}

export function AdminBatchForm({ batch }: { batch?: any }) {
  const [state, formAction] = useFormState(saveBatch, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={batch?.id ?? ""} />
      <input type="hidden" name="start_date" value={batch?.start_date ?? ""} />
      <input
        name="arrival_date"
        defaultValue={displayDate(batch?.expected_arrival_date)}
        placeholder="June 15 2026"
        required
        className="field"
      />
      <input name="batch_name" defaultValue={batch?.batch_name ?? ""} placeholder="Name, optional" className="field" />
      <select name="status" defaultValue={batch?.status ?? "Draft"} className="field">
        {batchStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <div className="flex items-center rounded-md bg-leaf-50 px-3 py-2 text-sm font-bold text-leaf-700">
        Order numbers are generated automatically.
      </div>
      {state.message && (
        <p className={`rounded-md border p-3 text-sm font-semibold sm:col-span-2 ${state.ok ? "border-leaf-100 bg-leaf-50 text-leaf-700" : "border-red-100 bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}
      <AdminFormButton label="Save batch" />
    </form>
  );
}
