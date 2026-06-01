"use client";

import { useFormState } from "react-dom";
import { LockKeyhole, Sprout } from "lucide-react";
import { loginAdmin, type ActionState } from "@/app/actions";

const initialState: ActionState = { ok: false, message: "" };

export default function AdminLoginPage() {
  const [state, formAction] = useFormState(loginAdmin, initialState);
  return (
    <main className="grid min-h-screen place-items-center bg-stone-950 px-4 py-10">
      <form action={formAction} className="w-full max-w-sm rounded-lg border border-white/10 bg-white p-6 shadow-lift">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-leaf-700 text-white shadow-crisp">
          <Sprout className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-stone-950">Admin Login</h1>
        <p className="mt-1 text-sm leading-6 text-stone-600">Approved admins only.</p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="field mt-1.5" placeholder="admin@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" required className="field mt-1.5" placeholder="Password" />
          </div>
        </div>
        {state.message && <p className="mt-4 rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{state.message}</p>}
        <button className="btn-primary mt-5 w-full">
          <LockKeyhole className="h-4 w-4" />
          Sign in
        </button>
      </form>
    </main>
  );
}
