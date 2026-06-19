"use client";

import { useActionState, useMemo, useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { submitPreorder, type ActionState } from "@/app/actions";
import { useCart } from "@/components/cart-provider";
import { CopyButton } from "@/components/copy-button";
import { ETRANSFER_EMAIL } from "@/lib/constants";
import { money } from "@/lib/utils";

const initialState: ActionState = { ok: false, message: "" };

type CheckoutDefaults = {
  customerName?: string;
  customerEmail?: string;
  phone?: string;
};

export function CheckoutForm({ defaults, signedIn = false }: { defaults?: CheckoutDefaults; signedIn?: boolean }) {
  const cart = useCart();
  const [state, formAction, pending] = useActionState(submitPreorder, initialState);
  const [confirmed, setConfirmed] = useState(false);
  const [customerName, setCustomerName] = useState(defaults?.customerName ?? "");
  const [customerEmail, setCustomerEmail] = useState(defaults?.customerEmail ?? "");
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [notes, setNotes] = useState("");
  const itemsPayload = useMemo(
    () => JSON.stringify(cart.items.map((item) => ({ product_id: item.productId, quantity: item.quantity }))),
    [cart.items]
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Please only continue if you already sent the e-transfer. Orders marked paid without payment may be cancelled.")) {
          event.preventDefault();
        }
      }}
      className="surface space-y-5 p-5 sm:p-6"
    >
      <input type="hidden" name="items" value={itemsPayload} />
      {signedIn && <p className="rounded-md border border-leaf-100 bg-leaf-50 p-3 text-sm font-bold text-leaf-800">Signed in. Your contact details are filled in.</p>}
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <h2 className="font-black text-stone-950">Contact</h2>
        <p className="mt-1 text-sm text-stone-600">We use this to match your payment and order.</p>
        <div className="mt-4 grid gap-4">
          <div>
            <label className="label">Full name</label>
            <input
              name="customerName"
              required
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="field mt-1.5"
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="label">Email address</label>
            <input
              name="customerEmail"
              type="email"
              required
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              className="field mt-1.5"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Phone number</label>
            <input
              name="phone"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="field mt-1.5"
              placeholder="Your phone number"
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              name="notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="field mt-1.5"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-mango-100 bg-mango-50 p-4 text-sm">
        <h2 className="mb-3 font-black text-stone-950">Payment</h2>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-leaf-700 shadow-crisp">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="font-black text-stone-950">Total: {money(cart.total)}</p>
            <p className="mt-1 text-stone-700">Please send e-transfer before submitting your preorder.</p>
            <p className="mt-1 font-black text-leaf-700">{ETRANSFER_EMAIL}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <CopyButton label="E-transfer" value={ETRANSFER_EMAIL} />
          <CopyButton label="Total" value={money(cart.total)} />
        </div>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="font-black text-stone-950">Submit</h2>
        <label className="mt-3 flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
          <input
            name="confirmedPaid"
            type="checkbox"
            required
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1"
          />
          <span className="font-semibold text-stone-800">I confirm I have already sent the e-transfer payment.</span>
        </label>
      </div>
      {state.message && <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{state.message}</p>}
      <button
        type="submit"
        disabled={!cart.items.length || !confirmed || pending}
        className="btn-primary w-full"
      >
        <ShieldCheck className="h-4 w-4" />
        {pending ? "Submitting..." : "I Paid - Submit Preorder"}
      </button>
    </form>
  );
}
