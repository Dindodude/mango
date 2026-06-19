"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { sendTestEmail, type AdminActionState } from "@/app/actions";

const initialState: AdminActionState = { ok: false, message: "" };

export function EmailTestForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState(sendTestEmail, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
      <input name="to" type="email" required defaultValue={defaultEmail} className="field" placeholder="you@example.com" />
      <button type="submit" disabled={pending} className="btn-primary">
        <MailCheck className="h-4 w-4" />
        {pending ? "Sending..." : "Send test"}
      </button>
      {state.message && (
        <p className={`sm:col-span-2 rounded-md border p-3 text-sm font-semibold ${state.ok ? "border-leaf-100 bg-leaf-50 text-leaf-700" : "border-red-100 bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
