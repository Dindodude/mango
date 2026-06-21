import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { OrderTimeline } from "@/components/order-timeline";
import { ReorderButton } from "@/components/reorder-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ETRANSFER_EMAIL, PICKUP_ADDRESS } from "@/lib/constants";
import { customerOrderStatus, requireCustomer, timelineState } from "@/lib/customer";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CartLine } from "@/lib/types";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerOrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const session = await requireCustomer();
  const user = session.user!;

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,customer_id,customer_email,order_number,total_amount,payment_status,order_status,created_at,order_items(product_name_snapshot,quantity,line_total)")
    .eq("order_number", orderNumber)
    .neq("order_status", "Cancelled")
    .maybeSingle();

  if (!order || (order.customer_id !== user.id && String(order.customer_email ?? "").toLowerCase() !== user.email)) notFound();

  const names = (order.order_items ?? []).map((item: any) => item.product_name_snapshot);
  const { data: products } = names.length
    ? await supabase.from("products").select("id,name,category,selling_price").eq("active", true).in("name", names)
    : { data: [] };
  const productsByName = new Map((products ?? []).map((product: any) => [product.name, product]));
  const reorderLines: CartLine[] = (order.order_items ?? [])
    .map((item: any) => {
      const product = productsByName.get(item.product_name_snapshot);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        price: Number(product.selling_price),
        quantity: Number(item.quantity)
      };
    })
    .filter(Boolean) as CartLine[];

  return (
    <main className="public-page">
      <SiteHeader />
      <div className="shell max-w-4xl py-8 sm:py-12">
        <Link href="/account" className="text-sm font-bold text-leaf-700 hover:text-leaf-900">Back to my orders</Link>
        <div className="mt-5 premium-panel p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Order</p>
              <h1 className="mt-2 text-4xl font-black text-stone-950">{order.order_number}</h1>
              <p className="mt-2 text-sm font-semibold text-stone-600">{customerOrderStatus(order.payment_status, order.order_status)}</p>
            </div>
            <p className="text-2xl font-black text-stone-950">{money(order.total_amount)}</p>
          </div>

          <div className="mt-6">
            <OrderTimeline state={timelineState(order.payment_status, order.order_status)} />
          </div>

          <div className="mt-6 space-y-3">
            {order.order_items?.map((item: any) => (
              <div key={item.product_name_snapshot} className="flex items-start justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm">
                <div>
                  <p className="font-black text-stone-950">{item.product_name_snapshot}</p>
                  <p className="text-stone-600">Quantity: {item.quantity}</p>
                </div>
                <p className="font-black text-stone-950">{money(item.line_total)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <CopyButton label="Order ID" value={order.order_number} />
            <CopyButton label="E-transfer" value={ETRANSFER_EMAIL} />
            <CopyButton label="Pickup" value={PICKUP_ADDRESS} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <ReorderButton lines={reorderLines} />
            <Link href="/preorder" className="btn-secondary rounded-full">Continue shopping</Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
