import Link from "next/link";
import { CalendarDays, Clock, MessageCircle, ShoppingBag } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CONTACT_PHONE_E164 } from "@/lib/constants";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/utils";

export default async function PreorderPage() {
  const supabase = hasSupabaseConfig() ? await createClient() : null;
  const { data: batch } = supabase
    ? await supabase.from("batches").select("*").eq("status", "Active").maybeSingle()
    : { data: null };
  const { data: products } = batch && supabase
    ? await supabase.from("products").select("id,name,description,category,selling_price").eq("active", true).order("display_order")
    : { data: [] };
  const groupedProducts = Object.values((products ?? []).reduce<Record<string, any>>((acc, product) => {
    acc[product.category] ??= { category: product.category, products: [] };
    acc[product.category].products.push(product);
    return acc;
  }, {}));

  return (
    <main>
      <SiteHeader />
      <div className="shell py-8 sm:py-10">
        <div className="mb-7 grid gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-crisp lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Current selection</p>
            <h1 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">Preorder mangoes and fruit.</h1>
            {batch ? (
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-stone-600">
                <CalendarDays className="h-4 w-4 text-leaf-700" />
                Expected arrival: {batch.expected_arrival_date}
              </p>
            ) : (
              <p className="mt-2 text-sm font-semibold text-stone-600">Preorders are currently closed. Please check back later.</p>
            )}
          </div>
          <Link href="/cart" className="btn-primary">
            <ShoppingBag className="h-4 w-4" />
            View cart
          </Link>
        </div>
        {!batch ? (
          <div className="surface grid gap-5 p-5 md:grid-cols-3">
            <div className="md:col-span-2">
              <span className="badge-warm">Closed</span>
              <h2 className="mt-4 text-2xl font-black text-stone-950">No preorder is active right now.</h2>
              <p className="mt-2 leading-7 text-stone-600">Please check back later or text us for the next seasonal batch.</p>
              <a href={`sms:${CONTACT_PHONE_E164}`} className="btn-secondary mt-5"><MessageCircle className="h-4 w-4" /> Text us</a>
            </div>
            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <Clock className="h-5 w-5 text-leaf-700" />
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-stone-500">Next step</p>
              <p className="mt-1 font-black text-stone-950">Wait for the next open batch.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedProducts.map((group: any) => (
              <section key={group.category}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-black text-stone-950">{group.category}</h2>
                  <span className="badge-good">{group.products.length} items</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.products.map((product: any) => (
                    <article key={product.id} className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-crisp transition hover:-translate-y-0.5 hover:border-leaf-100 hover:shadow-lift">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-leaf-700">{product.category}</p>
                            <h3 className="mt-1 text-lg font-black text-stone-950">{product.name}</h3>
                          </div>
                          <p className="rounded-md bg-stone-950 px-2.5 py-1 text-sm font-black text-white">{money(product.selling_price)}</p>
                        </div>
                        <p className="mt-3 min-h-12 text-sm leading-6 text-stone-600">{product.description || "Seasonal preorder item."}</p>
                        <AddToCart product={product} />
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
