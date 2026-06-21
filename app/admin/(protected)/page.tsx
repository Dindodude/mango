import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardList, Download, Mail, PackageCheck, Truck } from "lucide-react";
import { AdminPageHeader, AdminPanel, EmptyState, MetricCard, StatusBadge, WorkCard } from "@/components/admin-ui";
import { emailConfigStatus } from "@/lib/email";
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
  const problems = activeOrders.filter((order) => order.payment_status === "Payment Issue" || order.payment_status === "Awaiting Payment");
  const emailConfig = emailConfigStatus();
  const emailErrors = allOrders.filter((order) => order.last_email_error).slice(0, 4);
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
      <AdminPageHeader
        eyebrow="Today's work"
        title="Admin Command Center"
        description={activeBatch ? `Active batch: ${activeBatch.batch_name}` : "No active batch. Create or activate one before taking preorders."}
        action={(
          <>
            <Link href="/admin/orders?quick=needs-payment" className="btn-primary">
              Verify payments
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/admin/reports" className="btn-secondary">
              Reports
            </Link>
          </>
        )}
      />

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <WorkCard title="Payment checks" value={needsPayment.length} body="Customers claimed payment and need manual review." href="/admin/orders?quick=needs-payment" tone={needsPayment.length ? "warn" : "good"} />
        <WorkCard title="Pickup queue" value={ready.length} body="Orders marked ready and waiting for pickup." href="/admin/orders?quick=ready" />
        <WorkCard title="Problem orders" value={problems.length} body="Payment issue or awaiting payment." href="/admin/orders?quick=problem" tone={problems.length ? "warn" : "good"} />
        <WorkCard title="Supplier lines" value={supplierSummary.length} body="Verified paid product totals for supplier prep." href="/admin/reports" tone="good" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
        <AdminPanel
          title="Needs Attention"
          description="Handle these first. They affect confirmations and customer trust."
          action={<AlertTriangle className="h-5 w-5 text-amber-600" />}
        >
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
        </AdminPanel>

        <AdminPanel
          title="Supplier Snapshot"
          description="Verified paid orders only, sorted by quantity."
          action={<Truck className="h-5 w-5 text-leaf-700" />}
        >
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
        </AdminPanel>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <AdminPanel
          title="Email Health"
          description="Used for order received, payment verified, and signup codes."
          action={<Mail className="h-5 w-5 text-leaf-700" />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={emailConfig.hasApiKey ? "rounded-lg border border-leaf-100 bg-leaf-50 p-4" : "rounded-lg border border-amber-200 bg-amber-50 p-4"}>
              <p className="text-xs font-black uppercase tracking-wide text-stone-500">Resend key</p>
              <p className="mt-2 flex items-center gap-2 font-black text-stone-950">
                {emailConfig.hasApiKey ? <CheckCircle2 className="h-4 w-4 text-leaf-700" /> : <AlertTriangle className="h-4 w-4 text-amber-700" />}
                {emailConfig.hasApiKey ? "Present" : "Missing"}
              </p>
            </div>
            <div className={emailConfig.senderError ? "rounded-lg border border-amber-200 bg-amber-50 p-4" : "rounded-lg border border-leaf-100 bg-leaf-50 p-4"}>
              <p className="text-xs font-black uppercase tracking-wide text-stone-500">Sender</p>
              <p className="mt-2 font-black text-stone-950 wrap-anywhere">{emailConfig.senderError ?? emailConfig.from}</p>
            </div>
          </div>
          {emailErrors.length > 0 && (
            <div className="mt-4 space-y-2">
              {emailErrors.map((order: any) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="block rounded-md border border-red-100 bg-red-50 p-3 text-sm">
                  <span className="font-black text-stone-950">{order.order_number}</span>
                  <span className="mt-1 block font-semibold text-red-700 wrap-anywhere">{order.last_email_error}</span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/admin/reports" className="btn-secondary mt-4 w-full">Open email test</Link>
        </AdminPanel>

        <AdminPanel title="Fast Links" description="Common admin work without digging through menus.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/admin/orders?quick=ready" className="surface p-4 font-black text-stone-950 transition hover:border-leaf-100 hover:bg-leaf-50">
              Ready for pickup
              <ClipboardList className="mt-3 h-5 w-5 text-leaf-700" />
            </Link>
            <Link href="/admin/batches" className="surface p-4 font-black text-stone-950 transition hover:border-leaf-100 hover:bg-leaf-50">
              Batch tools
              <ClipboardList className="mt-3 h-5 w-5 text-leaf-700" />
            </Link>
            <Link href="/admin/products" className="surface p-4 font-black text-stone-950 transition hover:border-leaf-100 hover:bg-leaf-50">
              Products
              <ClipboardList className="mt-3 h-5 w-5 text-leaf-700" />
            </Link>
            <Link href="/admin/customers" className="surface p-4 font-black text-stone-950 transition hover:border-leaf-100 hover:bg-leaf-50">
              Customers
              <ClipboardList className="mt-3 h-5 w-5 text-leaf-700" />
            </Link>
          </div>
        </AdminPanel>
      </div>

      <div className="mt-6 hidden gap-3 sm:grid-cols-3">
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
