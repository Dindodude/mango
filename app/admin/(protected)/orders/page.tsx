import Link from "next/link";
import { Download, Filter, Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export default async function OrdersPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const supabase = createAdminClient();
  const search = searchParams.search ?? "";
  const payment = searchParams.payment ?? "";
  const status = searchParams.status ?? "";
  let query = supabase
    .from("orders")
    .select("*,batches(batch_name),order_items(product_name_snapshot,quantity)")
    .neq("order_status", "Cancelled")
    .order("created_at", { ascending: searchParams.sort === "oldest" });
  if (payment) query = query.eq("payment_status", payment);
  if (status) query = query.eq("order_status", status);
  const { data: orders } = await query;
  const filtered = (orders ?? []).filter((order) => {
    const haystack = `${order.customer_name} ${order.phone} ${order.order_number}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="admin-shell">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Fulfillment</p>
          <h1 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">Orders</h1>
          <p className="mt-1 text-sm font-semibold text-stone-600">{filtered.length} orders shown</p>
        </div>
        <a href={`/api/admin/export/orders?${new URLSearchParams(searchParams as Record<string, string>).toString()}`} className="btn-primary">
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <form className="surface mt-5 grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
          <input name="search" defaultValue={search} placeholder="Name, phone, order number" className="field pl-9" />
        </label>
        <select name="payment" defaultValue={payment} className="field">
          <option value="">All payment</option>
          {["Awaiting Payment", "Payment Claimed by Customer", "Payment Verified", "Payment Issue", "Refunded"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="field">
          <option value="">All status</option>
          {["Submitted", "Confirmed", "Ready for Pickup", "Completed"].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select name="sort" defaultValue={searchParams.sort ?? "newest"} className="field">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <button className="btn-secondary">
          <Filter className="h-4 w-4" />
          Apply
        </button>
      </form>

      <div className="table-shell mt-5">
        <table className="data-table min-w-[1120px]">
          <thead>
            <tr>
              {["Order", "Batch", "Customer", "Items", "Total", "Cost", "Profit", "Payment", "Status", "Submitted"].map((head) => (
                <th key={head}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className={order.payment_status === "Payment Claimed by Customer" ? "bg-amber-50/70" : ""}>
                <td className="font-black">
                  <Link className="text-leaf-700 hover:text-leaf-900" href={`/admin/orders/${order.id}`}>
                    {order.order_number}
                  </Link>
                </td>
                <td>{order.batches?.batch_name}</td>
                <td>
                  <span className="font-bold text-stone-950">{order.customer_name}</span>
                  <br />
                  <span className="text-stone-500">{order.phone}</span>
                </td>
                <td>{order.order_items?.map((item: any) => `${item.product_name_snapshot} x${item.quantity}`).join(", ")}</td>
                <td className="font-bold text-stone-950">{money(order.total_amount)}</td>
                <td>{money(order.total_cost)}</td>
                <td className="font-bold text-leaf-700">{money(order.total_profit)}</td>
                <td>
                  <StatusBadge status={order.payment_status} />
                </td>
                <td>
                  <StatusBadge status={order.order_status} />
                </td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={10} className="py-10 text-center font-semibold text-stone-500">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status.includes("Verified") || status.includes("Completed") || status.includes("Confirmed")) {
    return <span className="badge-good">{status}</span>;
  }
  if (status.includes("Issue") || status.includes("Claimed") || status.includes("Awaiting")) {
    return <span className="badge-warm">{status}</span>;
  }
  return <span className="badge">{status}</span>;
}
