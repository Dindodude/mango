import { Copy, CreditCard, Mail, PackageCheck, Save } from "lucide-react";
import { updateOrder } from "@/app/actions";
import { StatusBadge } from "@/components/admin-ui";
import { orderStatuses, paymentStatuses, PICKUP_ADDRESS } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const { data: order } = await createAdminClient()
    .from("orders")
    .select("*,batches(*),order_items(*)")
    .eq("id", params.id)
    .maybeSingle();

  if (!order) return <div className="admin-shell">Order not found.</div>;
  const message = `Hi ${order.customer_name}, we received your preorder #${order.order_number}. Payment is verified and your order is confirmed. Pickup location: ${PICKUP_ADDRESS}.`;

  return (
    <div className="admin-shell max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Order detail</p>
          <h1 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">{order.order_number}</h1>
          <p className="mt-1 text-sm font-semibold text-stone-600">
            {order.customer_name} - {order.phone}
          </p>
          {order.customer_email && <p className="mt-1 text-sm font-semibold text-stone-500">{order.customer_email}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.payment_status} />
          <StatusBadge status={order.order_status} />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-stone-950">Item Breakdown</h2>
            <PackageCheck className="h-5 w-5 text-leaf-700" />
          </div>
          <div className="mt-4 space-y-3">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="rounded-md border border-stone-100 bg-stone-50 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-stone-950">{item.product_name_snapshot}</p>
                    <p className="text-stone-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-black text-stone-950">{money(item.line_total)}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-stone-600">
                  <span>Cost {money(item.line_cost)}</span>
                  <span className="text-right text-leaf-700">Profit {money(item.line_profit)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4 text-sm">
            <Row label="Total" value={money(order.total_amount)} strong />
            <Row label="Cost" value={money(order.total_cost)} />
            <Row label="Profit" value={money(order.total_profit)} good />
            <Row label="Batch" value={order.batches?.batch_name} />
            <Row label="Customer notes" value={order.notes || "None"} />
          </div>
          <div className="mt-4 rounded-lg border border-leaf-100 bg-leaf-50 p-4 text-sm">
            <div className="mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-leaf-700" />
              <h3 className="font-black text-stone-950">Email Status</h3>
            </div>
            <Row label="Order received email" value={order.order_received_email_sent_at ? "Sent" : "Not sent"} />
            <Row label="Payment verified email" value={order.payment_verified_email_sent_at ? "Sent" : "Not sent"} />
            {order.last_email_error && <Row label="Last email error" value={order.last_email_error} />}
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <Copy className="h-4 w-4 text-leaf-700" />
              <h3 className="font-black text-stone-950">Confirmation Message</h3>
            </div>
            <textarea readOnly value={message} className="field h-28 bg-mango-50" />
          </div>
        </section>

        <form action={updateOrder} className="surface p-5">
          <input type="hidden" name="id" value={order.id} />
          <div className="flex items-center justify-between">
            <h2 className="font-black text-stone-950">Update Order</h2>
            <CreditCard className="h-5 w-5 text-leaf-700" />
          </div>

          <label className="label mt-5 block">Payment status</label>
          <select name="payment_status" defaultValue={order.payment_status} className="field mt-1.5">
            {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>

          <label className="label mt-4 block">Order status</label>
          <select name="order_status" defaultValue={order.order_status} className="field mt-1.5">
            {orderStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>

          <label className="label mt-4 block">Payment reference notes</label>
          <textarea name="payment_reference_notes" defaultValue={order.payment_reference_notes ?? ""} className="field mt-1.5" />

          <label className="label mt-4 block">Admin notes</label>
          <textarea name="admin_notes" defaultValue={order.admin_notes ?? ""} className="field mt-1.5" />

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button name="payment_status" value="Payment Verified" className="btn-primary">Verify Payment</button>
            <button name="payment_status" value="Payment Issue" className="inline-flex min-h-11 items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-amber-700">Payment Not Found</button>
            <button name="order_status" value="Confirmed" className="btn-secondary">Mark Confirmed</button>
            <button name="order_status" value="Ready for Pickup" className="btn-secondary">Mark Ready</button>
            <button name="order_status" value="Completed" className="btn-secondary">Mark Completed</button>
          </div>
          <button className="btn-accent mt-4 w-full">
            <Save className="h-4 w-4" />
            Save changes
          </button>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value, strong = false, good = false }: { label: string; value: React.ReactNode; strong?: boolean; good?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-stone-100 py-2 last:border-b-0">
      <span className="text-stone-600">{label}</span>
      <span className={`text-right font-bold ${strong ? "text-stone-950" : ""} ${good ? "text-leaf-700" : ""}`}>{value}</span>
    </div>
  );
}
