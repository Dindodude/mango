import Link from "next/link";
import { PackageCheck, ShoppingBasket } from "lucide-react";
import { logoutCustomer } from "@/app/actions";
import { CustomerProfileForm } from "@/components/customer-profile-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { customerOrderStatus, requireCustomer } from "@/lib/customer";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await requireCustomer();
  const user = session.user!;

  const supabase = createAdminClient();
  const safeOrderSelect = "id,order_number,customer_name,customer_email,phone,total_amount,payment_status,order_status,created_at,order_items(product_name_snapshot,quantity,line_total)";
  const [{ data: customerOrders }, { data: emailOrders }] = await Promise.all([
    supabase.from("orders").select(safeOrderSelect).neq("order_status", "Cancelled").eq("customer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("orders").select(safeOrderSelect).neq("order_status", "Cancelled").ilike("customer_email", user.email).order("created_at", { ascending: false })
  ]);
  const orders = Object.values([...(customerOrders ?? []), ...(emailOrders ?? [])].reduce<Record<string, any>>((acc, order) => {
    acc[order.id] = order;
    return acc;
  }, {})).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <main>
      <SiteHeader />
      <div className="shell py-8 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Account</p>
            <h1 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">My orders</h1>
            <p className="mt-2 text-sm font-semibold text-stone-600">{user.email}</p>
          </div>
          <form action={logoutCustomer}>
            <button className="btn-secondary">Sign out</button>
          </form>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <CustomerProfileForm fullName={session.profile?.full_name} phone={session.profile?.phone} />
          <section className="surface p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black text-stone-950">Order history</h2>
                <p className="mt-1 text-sm text-stone-600">{orders.length} saved orders</p>
              </div>
              <Link href="/preorder" className="btn-primary"><ShoppingBasket className="h-4 w-4" /> New preorder</Link>
            </div>
            <div className="mt-4 space-y-3">
              {orders.map((order: any) => (
                <Link key={order.id} href={`/account/orders/${order.order_number}`} className="block rounded-lg border border-stone-200 bg-white p-4 shadow-crisp transition hover:border-leaf-100 hover:bg-leaf-50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-stone-950">{order.order_number}</p>
                      <p className="mt-1 text-sm font-semibold text-stone-600">{new Date(order.created_at).toLocaleDateString()} - {customerOrderStatus(order.payment_status, order.order_status)}</p>
                    </div>
                    <p className="font-black text-stone-950">{money(order.total_amount)}</p>
                  </div>
                  <p className="mt-3 text-sm text-stone-600">{order.order_items?.map((item: any) => `${item.product_name_snapshot} x${item.quantity}`).join(", ")}</p>
                </Link>
              ))}
              {!orders.length && (
                <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
                  <PackageCheck className="mx-auto h-8 w-8 text-stone-400" />
                  <p className="mt-3 font-black text-stone-950">No saved orders yet.</p>
                  <p className="mt-1 text-sm text-stone-600">Orders using this email will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
