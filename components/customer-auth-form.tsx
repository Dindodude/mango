"use client";

import Link from "next/link";
import { FormEvent, useActionState, useState, useTransition } from "react";
import { LockKeyhole, MailCheck, UserPlus } from "lucide-react";
import {
  completeCustomerSignup,
  loginCustomer,
  requestCustomerSignupCode,
  verifyCustomerSignupCode,
  type ActionState
} from "@/app/actions";

const initialState: ActionState = { ok: false, message: "" };

export function CustomerAuthForm({ mode }: { mode: "login" | "signup" }) {
  if (mode === "login") return <CustomerLoginForm />;
  return <CustomerSignupForm />;
}

function StatusMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p className={`rounded-md border p-3 text-sm font-semibold ${state.ok ? "border-leaf-100 bg-leaf-50 text-leaf-700" : "border-red-100 bg-red-50 text-red-700"}`}>
      {state.message}
    </p>
  );
}

function CustomerLoginForm() {
  const [state, formAction] = useActionState(loginCustomer, initialState);
  return (
    <form action={formAction} className="surface space-y-4 p-5 sm:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-leaf-50 text-leaf-700">
        <LockKeyhole className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-stone-950">Sign in</h1>
        <p className="mt-1 text-sm leading-6 text-stone-600">See your saved preorders and reorder faster.</p>
      </div>
      <label className="block">
        <span className="label">Email</span>
        <input name="email" type="email" required className="field mt-1.5" placeholder="you@example.com" />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input name="password" type="password" required minLength={6} className="field mt-1.5" placeholder="Your password" />
      </label>
      <StatusMessage state={state} />
      <button className="btn-primary w-full">Sign in</button>
      <p className="text-center text-sm font-semibold text-stone-600">
        Need an account?{" "}
        <Link className="text-leaf-700 hover:text-leaf-900" href="/account/signup">
          Create one
        </Link>
      </p>
    </form>
  );
}

function CustomerSignupForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code" | "details">("email");
  const [sendState, setSendState] = useState<ActionState>(initialState);
  const [verifyState, setVerifyState] = useState<ActionState>(initialState);
  const [completeState, completeAction] = useActionState(completeCustomerSignup, initialState);
  const [pending, startTransition] = useTransition();

  function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await requestCustomerSignupCode(initialState, formData);
      setSendState(result);
      if (result.ok) setStep("code");
    });
  }

  function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await verifyCustomerSignupCode(initialState, formData);
      setVerifyState(result);
      if (result.ok) setStep("details");
    });
  }

  return (
    <div className="surface space-y-4 p-5 sm:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-leaf-50 text-leaf-700">
        {step === "details" ? <UserPlus className="h-5 w-5" /> : <MailCheck className="h-5 w-5" />}
      </div>
      <div>
        <h1 className="text-2xl font-black text-stone-950">Create account</h1>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          {step === "email" && "Enter your email. We will send a short code."}
          {step === "code" && "Enter the code from your email."}
          {step === "details" && "Finish your profile and choose a password."}
        </p>
      </div>

      {step === "email" && (
        <form onSubmit={requestCode} className="space-y-4">
          <label className="block">
            <span className="label">Email</span>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field mt-1.5"
              placeholder="you@example.com"
            />
          </label>
          <StatusMessage state={sendState} />
          <button disabled={pending} className="btn-primary w-full">{pending ? "Sending..." : "Send code"}</button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} className="space-y-4">
          <input type="hidden" name="email" value={email} />
          <label className="block">
            <span className="label">Code</span>
            <input
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="field mt-1.5 text-center text-xl font-black tracking-[0.25em]"
              placeholder="000000"
            />
          </label>
          <StatusMessage state={verifyState} />
          <button disabled={pending} className="btn-primary w-full">{pending ? "Checking..." : "Verify code"}</button>
          <button type="button" onClick={() => { setStep("email"); setSendState(initialState); setVerifyState(initialState); }} className="btn-secondary w-full">
            Use a different email
          </button>
        </form>
      )}

      {step === "details" && (
        <form action={completeAction} className="space-y-4">
          <input type="hidden" name="code" value={code} />
          <label className="block">
            <span className="label">Email</span>
            <input name="email" type="email" readOnly value={email} className="field mt-1.5 bg-stone-50" />
          </label>
          <label className="block">
            <span className="label">Full name</span>
            <input name="fullName" required className="field mt-1.5" placeholder="Your full name" />
          </label>
          <label className="block">
            <span className="label">Phone number</span>
            <input name="phone" required className="field mt-1.5" placeholder="Your phone number" />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input name="password" type="password" required minLength={6} className="field mt-1.5" placeholder="At least 6 characters" />
          </label>
          <StatusMessage state={completeState} />
          <button className="btn-primary w-full">Create account</button>
        </form>
      )}

      <p className="text-center text-sm font-semibold text-stone-600">
        Already have an account?{" "}
        <Link className="text-leaf-700 hover:text-leaf-900" href="/account/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
