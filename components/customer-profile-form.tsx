"use client";

import { useActionState } from "react";
import { saveCustomerProfile, type ActionState } from "@/app/actions";

const initialState: ActionState = { ok: false, message: "" };

export function CustomerProfileForm({ fullName, phone }: { fullName?: string | null; phone?: string | null }) {
  const [state, formAction] = useActionState(saveCustomerProfile, initialState);
  return (
    <form action={formAction} className="surface p-5">
      <h2 className="font-black text-stone-950">Saved contact</h2>
      <p className="mt-1 text-sm leading-6 text-stone-600">Used to make checkout faster next time.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="label">Full name</span>
          <input name="fullName" required defaultValue={fullName ?? ""} className="field mt-1.5" />
        </label>
        <label>
          <span className="label">Phone</span>
          <input name="phone" required defaultValue={phone ?? ""} className="field mt-1.5" />
        </label>
      </div>
      {state.message && (
        <p className={`mt-3 rounded-md border p-3 text-sm font-semibold ${state.ok ? "border-leaf-100 bg-leaf-50 text-leaf-700" : "border-red-100 bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}
      <button className="btn-secondary mt-4">Save contact</button>
    </form>
  );
}
