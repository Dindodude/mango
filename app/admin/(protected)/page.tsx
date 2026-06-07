import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Banknote, Boxes, ClipboardList, CreditCard, DollarSign, PackageCheck, TrendingUp } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();
  const [{ data: activeBatch }, { data: orders }, { data: recentOrders }, { data: items }] = await Promise.all([
    supabase.from("batches").select("*").eq("status", "Active").maybeSingle(),
    supabase.from("orders").select("*,batches(batch_name)").neq("order_status", "Cancelled").order("created_at", { ascending: false }),
    supabase.from("orders").select("*,batches(batch_name)").neq("order_status", "Cancelled").order("created_at", { ascending: false }).limit(8),
    supabase.from("order_items").select("product_name_snapshot,quantity,line_total,line_cost,line_profit,orders!inner(order_status)").neq("orders.order_status", "Cancelled")
  ]);

  const allOrders = orders ?? [];
  const paid = allOrders.filter((order) => order.payment_status === "Payment Verified");
  const problem = allOrders.filter((order) => ["Awaiting Payment", "Payment Issue", "Payment Claimed by Customer"].includes(order.payment_status));
  const totals = allOrders.reduce(
    (acc, order) => ({
      revenue: acc.revenue + Number(order.total_amount),
      cost: acc.cost + Number(order.total_cost),
      profit: acc.profit + Number(order.total_profit),
      outstanding: acc.outstanding + (order.payment_status === "Payment Verified" ? 0 : Number(order.total_amount))
    }),
    { revenue: 0, cost: 0, profit: 0, outstanding: 0 }
  );

  const productSummary = Object.values(
    (items ?? []).reduce<Record<string, { name: string; quantity: number; revenue: number }>>((acc, item) => {
      const key = item.product_name_snapshot;
      acc[key] ??= { name: key, quantity: 0, revenue: 0 };
      acc[key].quantity += Number(item.quantity);
      acc[key].revenue += Number(item.line_total);
      return acc;
    }, {})
  ).slice(0, 8);

  return (
    <div className="admin-shell">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">Dashboard</h1>
          <p className="mt-1 text-sm font-semibold text-stone-600">{activeBatch ? `Active: ${activeBatch.batch_name}` : "No active batch"}</p>
        </div>
        <Link href="/admin/orders" className="btn-primary">
          View orders
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<ClipboardList />} label="Total orders" value={allOrders.length} />
        <Metric icon={<PackageCheck />} label="Submitted" value={allOrders.filter((o) => o.order_status === "Submitted").length} />
        <Metric icon={<CreditCard />} label="Paid" value={paid.length} />
        <Metric icon={<AlertTriangle />} label="Unpaid/problem" value={problem.length} warning />
        <Metric icon={<DollarSign />} label="Revenue" value={money(totals.revenue)} />
        <Metric icon={<Banknote />} label="Cost" value={money(totals.cost)} />
        <Metric icon={<TrendingUp />} label="Profit" value={money(totals.profit)} />
        <Metric icon={<AlertTriangle />} label="Outstanding" value={money(totals.outstanding)} warning />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-stone-950">Product Summary</h2>
            <Boxes className="h-5 w-5 text-leaf-700" />
          </div>
          <div className="mt-4 space-y-3">
            {productSummary.map((product) => (
              <div key={product.name} className="flex items-center justify-between gap-4 rounded-md border border-stone-100 bg-stone-50 px-3 py-2 text-sm">
                <span className="font-bold text-stone-900">{product.name}</span>
                <span className="text-right font-semibold text-stone-600">
                  {product.quantity} units - {money(product.revenue)}
                </span>
              </div>
            ))}
            {!productSummary.length && <p className="rounded-md bg-stone-50 p-4 text-sm font-semibold text-stone-600">No product totals yet.</p>}
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-stone-950">Recent Orders</h2>
            <ClipboardList className="h-5 w-5 text-leaf-700" />
          </div>
          <div className="mt-4 space-y-3">
            {(recentOrders ?? []).map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex justify-between gap-4 rounded-md border border-stone-100 bg-white p-3 text-sm shadow-crisp transition hover:border-leaf-100 hover:bg-leaf-50">
                <span>
                  <strong className="text-stone-950">{order.order_number}</strong>
                  <br />
                  <span className="text-stone-600">{order.customer_name}</span>
                </span>
                <span className="text-right font-bold text-stone-950">
                  {money(order.total_amount)}
                  <br />
                  {order.payment_status === "Payment Claimed by Customer" && <AlertTriangle className="ml-auto h-4 w-4 text-amber-600" />}
                </span>
              </Link>
            ))}
            {!(recentOrders ?? []).length && <p className="rounded-md bg-stone-50 p-4 text-sm font-semibold text-stone-600">No orders yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, warning = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; warning?: boolean }) {
  return (
    <div className={`surface p-4 ${warning ? "border-amber-200 bg-amber-50/70" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-stone-600">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${warning ? "bg-amber-100 text-amber-700" : "bg-leaf-50 text-leaf-700"}`}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-black text-stone-950">{value}</p>
    </div>
  );
}
