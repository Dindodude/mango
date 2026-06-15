"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LockKeyhole, UserPlus } from "lucide-react";
import { loginCustomer, signUpCustomer, type ActionState } from "@/app/actions";

const initialState: ActionState = { ok: false, message: "" };

export function CustomerAuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginCustomer : signUpCustomer;
  const [state, formAction] = useActionState(action, initialState);
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="surface space-y-4 p-5 sm:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-leaf-50 text-leaf-700">
        {isSignup ? <UserPlus className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
      </div>
      <div>
        <h1 className="text-2xl font-black text-stone-950">{isSignup ? "Create account" : "Sign in"}</h1>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          {isSignup ? "Use the same email you use at checkout." : "See your saved preorders and reorder faster."}
        </p>
      </div>
      {isSignup && (
        <>
          <label className="block">
            <span className="label">Full name</span>
            <input name="fullName" required className="field mt-1.5" placeholder="Your full name" />
          </label>
          <label className="block">
            <span className="label">Phone number</span>
            <input name="phone" required className="field mt-1.5" placeholder="Your phone number" />
          </label>
        </>
      )}
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" required className="field mt-1.5" placeholder="you@example.com" />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input name="password" type="password" required minLength={6} className="field mt-1.5" placeholder="At least 6 characters" />
      </label>
      {state.message && (
        <p className={`rounded-md border p-3 text-sm font-semibold ${state.ok ? "border-leaf-100 bg-leaf-50 text-leaf-700" : "border-red-100 bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}
      <button className="btn-primary w-full">{isSignup ? "Create account" : "Sign in"}</button>
      <p className="text-center text-sm font-semibold text-stone-600">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <Link className="text-leaf-700 hover:text-leaf-900" href={isSignup ? "/account/login" : "/account/signup"}>
          {isSignup ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
