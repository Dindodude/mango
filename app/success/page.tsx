import Link from "next/link";
import { CheckCircle2, MapPin } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ETRANSFER_EMAIL, PICKUP_ADDRESS } from "@/lib/constants";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  const orderNumber = searchParams.order ?? "";
  const order = hasSupabaseAdminConfig()
    ? (
        await createAdminClient()
          .from("orders")
          .select("order_number,total_amount,order_items(product_name_snapshot,quantity,line_total)")
          .eq("order_number", orderNumber)
          .maybeSingle()
      ).data
    : null;

  return (
    <main>
      <SiteHeader />
      <div className="shell max-w-2xl py-10">
        <div className="surface p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-leaf-50 text-leaf-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-stone-950">Order received.</h1>
          <p className="mt-3 leading-7 text-stone-700">Thank you for your preorder. We will check your payment and confirm soon.</p>
          {order && (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-mango-100 bg-mango-50 p-4">
                <p className="label">Order ID</p>
                <p className="text-xl font-bold">{order.order_number}</p>
              </div>
              <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.product_name_snapshot} className="flex justify-between text-sm">
                    <span>
                      {item.product_name_snapshot} x {item.quantity}
                    </span>
                    <span>{money(item.line_total)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-mango-100 pt-3 font-bold">
                <span>Amount paid</span>
                <span>{money(order.total_amount)}</span>
              </div>
              <p className="flex items-center gap-2 rounded-md bg-stone-50 p-3 text-sm">
                <MapPin className="h-4 w-4 text-leaf-700" />
                Pickup location: <strong>{PICKUP_ADDRESS}</strong>
              </p>
              <div className="grid gap-2">
                <CopyButton label="Order ID" value={order.order_number} />
                <CopyButton label="E-transfer email" value={ETRANSFER_EMAIL} />
                <CopyButton label="Total amount" value={money(order.total_amount)} />
              </div>
            </div>
          )}
          <Link href="/" className="btn-primary mt-6">
            Done
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
