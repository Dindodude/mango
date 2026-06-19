"use client";

import { useFormStatus } from "react-dom";
import { updateOrder } from "@/app/actions";

type ActionDef = {
  label: string;
  paymentStatus: string;
  orderStatus: string;
  tone?: "primary" | "warn" | "secondary";
};

const toneClass = {
  primary: "btn-primary",
  warn: "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-amber-600 px-3 py-2 text-sm font-bold text-white shadow-crisp transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60",
  secondary: "btn-secondary"
};

export function AdminOrderActions({
  orderId,
  paymentStatus,
  orderStatus,
  compact = false
}: {
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
  compact?: boolean;
}) {
  const actions: ActionDef[] = [
    { label: "Verify Payment", paymentStatus: "Payment Verified", orderStatus, tone: "primary" },
    { label: "Payment Not Found", paymentStatus: "Payment Issue", orderStatus, tone: "warn" },
    { label: "Confirm", paymentStatus, orderStatus: "Confirmed" },
    { label: "Ready", paymentStatus, orderStatus: "Ready for Pickup" },
    { label: "Complete", paymentStatus, orderStatus: "Completed" }
  ];

  return (
    <form action={updateOrder} className={compact ? "grid grid-cols-2 gap-2" : "admin-action-grid"}>
      <input type="hidden" name="id" value={orderId} />
      <input type="hidden" name="payment_status" value={paymentStatus} />
      <input type="hidden" name="order_status" value={orderStatus} />
      {actions.map((action) => (
        <QuickActionButton key={`${action.paymentStatus}:${action.orderStatus}`} action={action} compact={compact} />
      ))}
    </form>
  );
}

function QuickActionButton({ action, compact }: { action: ActionDef; compact: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="quick_action"
      value={`${action.paymentStatus}:${action.orderStatus}`}
      disabled={pending}
      className={`${toneClass[action.tone ?? "secondary"]} ${compact ? "min-h-10 px-2 py-2 text-xs" : ""}`}
    >
      {pending ? "Working..." : action.label}
    </button>
  );
}
