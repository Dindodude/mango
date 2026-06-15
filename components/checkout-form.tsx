"use client";

import { useActionState, useMemo, useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { submitPreorder, type ActionState } from "@/app/actions";
import { useCart } from "@/components/cart-provider";
import { ETRANSFER_EMAIL } from "@/lib/constants";
import { money } from "@/lib/utils";

const initialState: ActionState = { ok: false, message: "" };

export function CheckoutForm() {
  const cart = useCart();
  const [state, formAction] = useActionState(submitPreorder, initialState);
  const [confirmed, setConfirmed] = useState(false);
  const itemsPayload = useMemo(
    () => JSON.stringify(cart.items.map((item) => ({ product_id: item.productId, quantity: item.quantity }))),
    [cart.items]
  );

  return (
    <form
      action={(formData) => {
        if (!window.confirm("Please only continue if you already sent the e-transfer. Orders marked paid without payment may be cancelled.")) {
          return;
        }
        formAction(formData);
      }}
      className="surface space-y-5 p-5 sm:p-6"
    >
      <input type="hidden" name="items" value={itemsPayload} />
      <div>
        <label className="label">Full name</label>
        <input name="customerName" required className="field mt-1.5" placeholder="Your full name" />
      </div>
      <div>
        <label className="label">Email address</label>
        <input name="customerEmail" type="email" required className="field mt-1.5" placeholder="you@example.com" />
      </div>
      <div>
        <label className="label">Phone number</label>
        <input name="phone" required className="field mt-1.5" placeholder="Your phone number" />
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea name="notes" rows={3} className="field mt-1.5" placeholder="Optional" />
      </div>
      <div className="rounded-lg border border-mango-100 bg-mango-50 p-4 text-sm">
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
      </div>
      <label className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
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
      {state.message && <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">{state.message}</p>}
      <button
        disabled={!cart.items.length || !confirmed}
        className="btn-primary w-full"
      >
        <ShieldCheck className="h-4 w-4" />
        I Paid - Submit Preorder
      </button>
    </form>
  );
}
