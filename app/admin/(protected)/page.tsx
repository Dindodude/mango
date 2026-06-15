import Link from "next/link";
import { AlertTriangle, ArrowUpRight, ClipboardList, Download, PackageCheck, Truck } from "lucide-react";
import { AdminSectionHeader, EmptyState, MetricCard, StatusBadge } from "@/components/admin-ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();
  const [{ data: activeBatch }, { data: orders }, { data: items }] = await Promise.all([
    supabase.from("batches").select("*").eq("status", "Active").maybeSingle(),
    supabase.from("orders").select("*,batches(batch_name,batch_code),order_items(product_name_snapshot,quantity,line_total,line_profit)").neq("order_status", "Cancelled").order("created_at", { ascending: false }),
    supabase.from("order_items").select("product_name_snapshot,quantity,line_total,line_profit,orders!inner(payment_status,order_status,batch_id)").eq("orders.payment_status", "Payment Verified").neq("orders.order_status", "Cancelled")
  ]);

  const allOrders = orders ?? [];
  const activeOrders = activeBatch ? allOrders.filter((order) => order.batch_id === activeBatch.id) : allOrders;
  const needsPayment = activeOrders.filter((order) => order.payment_status === "Payment Claimed by Customer" || order.payment_status === "Payment Issue");
  const ready = activeOrders.filter((order) => order.order_status === "Ready for Pickup");
  const paid = activeOrders.filter((order) => order.payment_status === "Payment Verified");
  const totals = activeOrders.reduce(
    (acc, order) => ({
      revenue: acc.revenue + Number(order.total_amount),
      profit: acc.profit + Number(order.total_profit),
      outstanding: acc.outstanding + (order.payment_status === "Payment Verified" ? 0 : Number(order.total_amount))
    }),
    { revenue: 0, profit: 0, outstanding: 0 }
  );

  const supplierSummary = Object.values(
    (items ?? [])
      .filter((item: any) => !activeBatch || item.orders?.batch_id === activeBatch.id)
      .reduce<Record<string, { name: string; quantity: number; revenue: number; profit: number }>>((acc, item) => {
        const key = item.product_name_snapshot;
        acc[key] ??= { name: key, quantity: 0, revenue: 0, profit: 0 };
        acc[key].quantity += Number(item.quantity);
        acc[key].revenue += Number(item.line_total);
        acc[key].profit += Number(item.line_profit);
        return acc;
      }, {})
  ).sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="admin-shell">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminSectionHeader
          eyebrow="Operations"
          title="Admin Dashboard"
          description={activeBatch ? `Active batch: ${activeBatch.batch_name}` : "No active batch"}
        />
        <Link href="/admin/orders?quick=needs-payment" className="btn-primary">
          Verify payments
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Needs payment check" value={needsPayment.length} tone={needsPayment.length ? "warn" : "good"} />
        <MetricCard label="Verified paid" value={paid.length} tone="good" />
        <MetricCard label="Ready for pickup" value={ready.length} />
        <MetricCard label="Outstanding" value={money(totals.outstanding)} tone={totals.outstanding ? "warn" : "good"} />
        <MetricCard label="Active batch orders" value={activeOrders.length} />
        <MetricCard label="Revenue" value={money(totals.revenue)} />
        <MetricCard label="Profit" value={money(totals.profit)} tone="good" />
        <MetricCard label="All open orders" value={allOrders.length} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-stone-950">Needs Attention</h2>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-4 space-y-3">
            {needsPayment.slice(0, 8).map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="grid gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm shadow-crisp transition hover:bg-amber-100 sm:grid-cols-[1fr_auto]">
                <span>
                  <strong className="text-stone-950">{order.order_number}</strong>
                  <br />
                  <span className="text-stone-700">{order.customer_name} - {order.phone}</span>
                </span>
                <span className="flex items-center gap-2 sm:justify-end">
                  <StatusBadge status={order.payment_status} />
                  <strong>{money(order.total_amount)}</strong>
                </span>
              </Link>
            ))}
            {!needsPayment.length && <EmptyState title="No payment checks waiting." body="Orders that need manual payment review will show here." />}
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-stone-950">Supplier Snapshot</h2>
            <Truck className="h-5 w-5 text-leaf-700" />
          </div>
          <div className="mt-4 space-y-2">
            {supplierSummary.slice(0, 10).map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-4 rounded-md bg-stone-50 px-3 py-2 text-sm">
                <span className="font-black text-stone-950">{item.name}</span>
                <span className="text-right font-semibold text-stone-600">{item.quantity}</span>
              </div>
            ))}
            {!supplierSummary.length && <p className="rounded-md bg-stone-50 p-4 text-sm font-semibold text-stone-600">No verified paid items yet.</p>}
          </div>
          {activeBatch && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a href={`/api/admin/export/supplier?batchId=${activeBatch.id}`} className="btn-secondary min-h-10 px-3 py-2">
                <Download className="h-4 w-4" />
                Supplier CSV
              </a>
              <a href={`/api/admin/export/pickup?batchId=${activeBatch.id}`} className="btn-secondary min-h-10 px-3 py-2">
                <PackageCheck className="h-4 w-4" />
                Pickup list
              </a>
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href="/admin/orders?quick=ready" className="surface p-4 font-black text-stone-950 transition hover:border-leaf-100 hover:bg-leaf-50">
          Ready for pickup
          <ClipboardList className="mt-3 h-5 w-5 text-leaf-700" />
        </Link>
        <Link href="/admin/batches" className="surface p-4 font-black text-stone-950 transition hover:border-leaf-100 hover:bg-leaf-50">
          Batch tools
          <ClipboardList className="mt-3 h-5 w-5 text-leaf-700" />
        </Link>
        <Link href="/admin/reports" className="surface p-4 font-black text-stone-950 transition hover:border-leaf-100 hover:bg-leaf-50">
          Reports
          <ClipboardList className="mt-3 h-5 w-5 text-leaf-700" />
        </Link>
      </div>
    </div>
  );
}
