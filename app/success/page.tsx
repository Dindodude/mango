import Link from "next/link";
import { CheckCircle2, MapPin } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ETRANSFER_EMAIL, PICKUP_ADDRESS } from "@/lib/constants";
import { getCustomerSession } from "@/lib/customer";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string; token?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const session = await getCustomerSession();
  const orderNumber = resolvedSearchParams.order ?? "";
  const token = resolvedSearchParams.token ?? "";
  const order = hasSupabaseAdminConfig() && orderNumber && token
    ? (
        await createAdminClient()
          .from("orders")
          .select("order_number,customer_email,total_amount,order_items(product_name_snapshot,quantity,line_total)")
          .eq("order_number", orderNumber)
          .eq("success_token", token)
          .maybeSingle()
      ).data
    : null;

  return (
    <main className="public-page">
      <SiteHeader />
      <div className="shell max-w-3xl py-10 sm:py-14">
        <div className="premium-panel relative overflow-hidden p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-leaf-100/60 blur-3xl" />
          <div className="success-pulse relative flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-50 text-leaf-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="relative mt-5 text-4xl font-black text-stone-950 sm:text-5xl">Order received.</h1>
          <p className="relative mt-3 leading-7 text-stone-700">Thank you for your preorder. We will check your payment and confirm soon.</p>
          {order && (
            <div className="relative mt-6 space-y-4">
              <div className="rounded-2xl border border-mango-100 bg-mango-50 p-4">
                <p className="label">Order ID</p>
                <p className="text-2xl font-black text-stone-950">{order.order_number}</p>
              </div>
              <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4">
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
              <p className="flex items-center gap-2 rounded-2xl bg-stone-50 p-3 text-sm">
                <MapPin className="h-4 w-4 text-leaf-700" />
                Pickup location: <strong>{PICKUP_ADDRESS}</strong>
              </p>
              <div className="grid gap-2">
                <CopyButton label="Order ID" value={order.order_number} />
                <CopyButton label="E-transfer email" value={ETRANSFER_EMAIL} />
                <CopyButton label="Total amount" value={money(order.total_amount)} />
              </div>
              {!session.user && order.customer_email && (
                <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-4">
                  <p className="font-black text-stone-950">Want to track this later?</p>
                  <p className="mt-1 text-sm leading-6 text-stone-700">Create an account with {order.customer_email} and this order will show in My orders after email verification.</p>
                  <Link href="/account/signup" className="btn-secondary mt-4 rounded-full">Create account</Link>
                </div>
              )}
            </div>
          )}
          <Link href="/" className="btn-primary mt-6 rounded-full">
            Done
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
