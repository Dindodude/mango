import Link from "next/link";
import { ArrowUpRight, Search, UsersRound } from "lucide-react";
import { AdminPageHeader, EmptyState, MetricCard, StatusBadge } from "@/components/admin-ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const resolvedSearchParams = await searchParams;
  const search = (resolvedSearchParams.search ?? "").toLowerCase();
  const supabase = createAdminClient();
  const [{ data: orders }, { data: profiles }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,order_number,customer_name,customer_email,phone,total_amount,total_profit,payment_status,order_status,created_at")
      .neq("order_status", "Cancelled")
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_profiles")
      .select("email,full_name,phone,email_verified_at")
  ]);
  const profileByEmail = new Map((profiles ?? []).map((profile) => [String(profile.email).toLowerCase(), profile]));

  const customers = Object.values((orders ?? []).reduce<Record<string, any>>((acc, order) => {
    const key = String(order.customer_email || order.phone || order.customer_name).toLowerCase();
    acc[key] ??= {
      key,
      name: order.customer_name,
      email: order.customer_email,
      phone: order.phone,
      orders: [],
      revenue: 0,
      profit: 0
    };
    acc[key].profile = order.customer_email ? profileByEmail.get(String(order.customer_email).toLowerCase()) : null;
    acc[key].orders.push(order);
    acc[key].revenue += Number(order.total_amount);
    acc[key].profit += Number(order.total_profit);
    return acc;
  }, {})).filter((customer: any) => {
    const haystack = `${customer.name} ${customer.email ?? ""} ${customer.phone}`.toLowerCase();
    return haystack.includes(search);
  }).sort((a: any, b: any) => b.orders.length - a.orders.length);

  const repeatCustomers = customers.filter((customer: any) => customer.orders.length > 1).length;

  return (
    <div className="admin-shell">
      <AdminPageHeader eyebrow="Customer lookup" title="Customers" description="Find repeat customers and order history fast." />

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MetricCard label="Customers shown" value={customers.length} />
        <MetricCard label="Repeat customers" value={repeatCustomers} />
        <MetricCard label="Customer revenue" value={money(customers.reduce((sum: number, customer: any) => sum + customer.revenue, 0))} />
      </div>

      <form className="surface mt-5 flex flex-col gap-3 p-4 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
          <input name="search" defaultValue={resolvedSearchParams.search ?? ""} placeholder="Search name, phone, or email" className="field pl-9" />
        </label>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      <div className="mt-5 grid gap-4">
        {customers.map((customer: any) => (
          <section key={customer.key} className="surface overflow-hidden">
            <div className="grid gap-3 border-b border-stone-200 bg-stone-50 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <UsersRound className="h-5 w-5 text-leaf-700" />
                  <h2 className="font-black text-stone-950">{customer.name}</h2>
                  {customer.orders.length > 1 && <span className="badge-good">Repeat</span>}
                  {customer.profile?.email_verified_at && <span className="badge">Account</span>}
                </div>
                <p className="mt-1 text-sm font-semibold text-stone-600">{customer.email || "No email"} - {customer.phone}</p>
                {customer.profile && <p className="mt-1 text-xs font-bold text-stone-500">Profile: {customer.profile.full_name || customer.name} - {customer.profile.phone || customer.phone}</p>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <MiniStat label="Orders" value={customer.orders.length} />
                <MiniStat label="Revenue" value={money(customer.revenue)} />
                <MiniStat label="Profit" value={money(customer.profit)} />
              </div>
            </div>
            {customer.orders[0] && (
              <div className="border-b border-stone-100 bg-white px-4 py-3">
                <Link href={`/admin/orders/${customer.orders[0].id}`} className="btn-secondary w-full sm:w-auto">
                  Open latest order
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            <div className="divide-y divide-stone-100">
              {customer.orders.slice(0, 6).map((order: any) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="grid gap-2 p-4 text-sm transition hover:bg-leaf-50 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
                  <span className="font-black text-leaf-700">{order.order_number}</span>
                  <span className="font-semibold text-stone-600">{new Date(order.created_at).toLocaleDateString()}</span>
                  <StatusBadge status={order.payment_status} />
                  <span className="font-black text-stone-950">{money(order.total_amount)}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {!customers.length && <EmptyState title="No customers found." body="Try searching by another name, phone, or email." />}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-stone-200 bg-white px-3 py-2">
      <p className="text-[11px] font-black uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 font-black text-stone-950">{value}</p>
    </div>
  );
}
