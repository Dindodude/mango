import Link from "next/link";
import { CalendarDays, ShoppingBag } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CONTACT_PHONE_E164 } from "@/lib/constants";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/utils";

export default async function PreorderPage() {
  const supabase = hasSupabaseConfig() ? createClient() : null;
  const { data: batch } = supabase
    ? await supabase.from("batches").select("*").eq("status", "Active").maybeSingle()
    : { data: null };
  const { data: products } = batch && supabase
    ? await supabase.from("products").select("id,name,description,category,selling_price").eq("active", true).order("display_order")
    : { data: [] };

  return (
    <main>
      <SiteHeader />
      <div className="shell py-8 sm:py-10">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
          <div className="surface grid gap-5 overflow-hidden p-5 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <img
              src="https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=1000&q=85"
              alt="Fresh mangoes"
              className="h-56 w-full rounded-md object-cover md:h-72"
            />
            <div>
              <span className="badge-warm">Closed</span>
              <h2 className="mt-4 text-2xl font-black text-stone-950">No preorder is active right now.</h2>
              <p className="mt-2 leading-7 text-stone-600">Please check back later or text us for the next seasonal batch.</p>
              <a href={`sms:${CONTACT_PHONE_E164}`} className="btn-secondary mt-5">Text us</a>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products?.map((product) => (
              <article key={product.id} className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-crisp transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-leaf-700">{product.category}</p>
                      <h2 className="mt-1 text-lg font-black text-stone-950">{product.name}</h2>
                    </div>
                    <p className="rounded-md bg-stone-950 px-2.5 py-1 text-sm font-black text-white">{money(product.selling_price)}</p>
                  </div>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-stone-600">{product.description}</p>
                  <AddToCart product={product} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
