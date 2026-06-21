import Link from "next/link";
import { Download, Filter, Search } from "lucide-react";
import { AdminOrderActions } from "@/components/admin-order-actions";
import { AdminPageHeader, EmptyState, StatusBadge } from "@/components/admin-ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

function quickFilter(order: any, quick: string) {
  if (quick === "needs-payment") return order.payment_status === "Payment Claimed by Customer" || order.payment_status === "Payment Issue";
  if (quick === "paid") return order.payment_status === "Payment Verified";
  if (quick === "ready") return order.order_status === "Ready for Pickup";
  if (quick === "completed") return order.order_status === "Completed";
  if (quick === "problem") return order.payment_status !== "Payment Verified" || order.order_status === "Submitted";
  return true;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const supabase = createAdminClient();
  const search = resolvedSearchParams.search ?? "";
  const payment = resolvedSearchParams.payment ?? "";
  const status = resolvedSearchParams.status ?? "";
  const batch = resolvedSearchParams.batch ?? "";
  const quick = resolvedSearchParams.quick ?? "";
  const { data: batches } = await supabase
    .from("batches")
    .select("id,batch_name,batch_code,status")
    .order("created_at", { ascending: false });
  let query = supabase
    .from("orders")
    .select("*,batches(id,batch_name,batch_code),order_items(product_name_snapshot,quantity)")
    .neq("order_status", "Cancelled")
    .order("created_at", { ascending: resolvedSearchParams.sort === "oldest" });
  if (payment) query = query.eq("payment_status", payment);
  if (status) query = query.eq("order_status", status);
  if (batch) query = query.eq("batch_id", batch);
  const { data: orders } = await query;
  const filtered = (orders ?? []).filter((order) => {
    const haystack = `${order.customer_name} ${order.phone} ${order.customer_email ?? ""} ${order.order_number}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && quickFilter(order, quick);
  });
  const groupedOrders = Object.values(
    filtered.reduce<Record<string, any>>((acc, order) => {
      const batchName = order.batches?.batch_name ?? "No batch";
      acc[batchName] ??= { batchName, batchId: order.batches?.id, orders: [], revenue: 0, profit: 0, quantity: 0, paid: 0, needsPayment: 0 };
      acc[batchName].orders.push(order);
      acc[batchName].revenue += Number(order.total_amount);
      acc[batchName].profit += Number(order.total_profit);
      acc[batchName].quantity += (order.order_items ?? []).reduce((sum: number, item: any) => sum + Number(item.quantity), 0);
      acc[batchName].paid += order.payment_status === "Payment Verified" ? 1 : 0;
      acc[batchName].needsPayment += order.payment_status === "Payment Claimed by Customer" || order.payment_status === "Payment Issue" ? 1 : 0;
      return acc;
    }, {})
  );

  return (
    <div className="admin-shell">
      <AdminPageHeader
        eyebrow="Fulfillment"
        title="Orders"
        description={`${filtered.length} orders shown. Use batch sections for supplier and pickup exports.`}
        action={(
          <a href={`/api/admin/export/orders?${new URLSearchParams(resolvedSearchParams as Record<string, string>).toString()}`} className="btn-primary">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        )}
      />

      <div className="admin-nav-scroll -mx-1 mt-5 flex gap-2 overflow-x-auto px-1">
        {[
          ["", "All"],
          ["needs-payment", "Needs payment check"],
          ["paid", "Paid"],
          ["ready", "Ready"],
          ["completed", "Completed"],
          ["problem", "Problem"]
        ].map(([value, label]) => (
          <Link key={value || "all"} href={`/admin/orders${value ? `?quick=${value}` : ""}`} className={quick === value ? "btn-primary min-h-10 shrink-0 px-3 py-2" : "btn-secondary min-h-10 shrink-0 px-3 py-2"}>
            {label}
          </Link>
        ))}
      </div>

      <form className="surface mt-4 grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
          <input name="search" defaultValue={search} placeholder="Name, phone, email, order number" className="field pl-9" />
        </label>
        <select name="batch" defaultValue={batch} className="field">
          <option value="">All batches</option>
          {(batches ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.status === "Active" ? "Active - " : ""}{item.batch_name}
            </option>
          ))}
        </select>
        <select name="payment" defaultValue={payment} className="field">
          <option value="">All payment</option>
          {["Awaiting Payment", "Payment Claimed by Customer", "Payment Verified", "Payment Issue", "Refunded"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select name="status" defaultValue={status} className="field">
          <option value="">All status</option>
          {["Submitted", "Confirmed", "Ready for Pickup", "Completed"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select name="sort" defaultValue={resolvedSearchParams.sort ?? "newest"} className="field">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <button type="submit" className="btn-secondary">
          <Filter className="h-4 w-4" />
          Apply
        </button>
      </form>

      <div className="mt-5 space-y-5">
        {groupedOrders.map((group: any) => (
          <section key={group.batchName} className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-crisp">
            <div className="flex flex-col gap-3 border-b border-stone-200 bg-stone-50 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-black text-stone-950">{group.batchName}</h2>
                <p className="mt-1 text-sm font-semibold text-stone-600">{group.orders.length} orders - {group.paid} paid - {group.needsPayment} need check - {group.quantity} items - {money(group.revenue)}</p>
              </div>
              {group.batchId && (
                <div className="flex flex-wrap gap-2">
                  <ExportButton href={`/api/admin/export/batch-paid?batchId=${group.batchId}`} label="Paid" />
                  <ExportButton href={`/api/admin/export/supplier?batchId=${group.batchId}`} label="Supplier" />
                  <ExportButton href={`/api/admin/export/pickup?batchId=${group.batchId}`} label="Pickup" />
                  <ExportButton href={`/api/admin/export/problem?batchId=${group.batchId}`} label="Problems" />
                </div>
              )}
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {group.orders.map((order: any) => <MobileOrderCard key={order.id} order={order} />)}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="data-table min-w-[1120px]">
                <thead>
                  <tr>{["Order", "Customer", "Items", "Total", "Profit", "Payment", "Status", "Submitted", "Open"].map((head) => <th key={head}>{head}</th>)}</tr>
                </thead>
                <tbody>
                  {group.orders.map((order: any) => (
                    <tr key={order.id} className={order.payment_status === "Payment Claimed by Customer" ? "bg-amber-50/70" : ""}>
                      <td className="font-black"><Link className="text-leaf-700 hover:text-leaf-900" href={`/admin/orders/${order.id}`}>{order.order_number}</Link></td>
                      <td><span className="font-bold text-stone-950">{order.customer_name}</span><br /><span className="text-stone-500">{order.phone}</span></td>
                      <td>{order.order_items?.map((item: any) => `${item.product_name_snapshot} x${item.quantity}`).join(", ")}</td>
                      <td className="font-bold text-stone-950">{money(order.total_amount)}</td>
                      <td className="font-bold text-leaf-700">{money(order.total_profit)}</td>
                      <td><StatusBadge status={order.payment_status} /></td>
                      <td><StatusBadge status={order.order_status} /></td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td><Link className="btn-secondary min-h-9 px-3 py-1.5 text-xs" href={`/admin/orders/${order.id}`}>Open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {!groupedOrders.length && <EmptyState title="No orders match these filters." body="Try clearing filters or checking another batch." />}
      </div>
    </div>
  );
}

function ExportButton({ href, label }: { href: string; label: string }) {
  return <a href={href} className="btn-secondary min-h-9 px-3 py-1.5 text-xs"><Download className="h-3.5 w-3.5" />{label}</a>;
}

function MobileOrderCard({ order }: { order: any }) {
  return (
    <article className={`rounded-lg border p-4 shadow-crisp ${order.payment_status === "Payment Claimed by Customer" ? "border-amber-200 bg-amber-50" : "border-stone-200 bg-white"}`}>
      <Link href={`/admin/orders/${order.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-black text-stone-950">{order.order_number}</p>
            <p className="text-sm font-semibold text-stone-600">{order.customer_name}</p>
            <p className="text-xs text-stone-500">{order.phone}</p>
          </div>
          <p className="font-black text-stone-950">{money(order.total_amount)}</p>
        </div>
        <p className="mt-3 text-sm text-stone-700">{order.order_items?.map((item: any) => `${item.product_name_snapshot} x${item.quantity}`).join(", ")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge status={order.payment_status} />
          <StatusBadge status={order.order_status} />
        </div>
      </Link>
      <div className="mt-4 border-t border-stone-200 pt-3">
        <AdminOrderActions orderId={order.id} paymentStatus={order.payment_status} orderStatus={order.order_status} compact />
      </div>
    </article>
  );
}
