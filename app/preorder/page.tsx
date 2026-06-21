import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import { AddToCart } from "@/components/add-to-cart";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CONTACT_PHONE_E164, ETRANSFER_EMAIL, PICKUP_ADDRESS } from "@/lib/constants";
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
    <main className="public-page">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-stone-200/80">
        <div className="public-ambient" />
        <div className="shell relative py-9 sm:py-12">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div className="reveal-up">
              <div className="seasonal-chip">
                <Sparkles className="h-4 w-4 text-mango-500" />
                Current selection
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-stone-950 sm:text-5xl">
                Choose your preorder items.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-stone-600 sm:text-base">
                No stock limits, no complicated checkout. Pick the items you want, send e-transfer, then submit the preorder.
              </p>
            </div>
            <div className="premium-card p-4 reveal-up reveal-delay-1">
              <span className={batch ? "badge-good" : "badge-warm"}>{batch ? "Open now" : "Closed"}</span>
              <p className="mt-3 font-black text-stone-950">{batch ? batch.batch_name : "No active preorder"}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-stone-600">
                {batch ? `Arrival ${formatDate(batch.expected_arrival_date)}. Cutoff ${formatDate(batch.cutoff_date)}.` : "Text us for the next batch."}
              </p>
              <Link href="/cart" className="btn-primary mt-4 w-full rounded-full">
                <ShoppingBag className="h-4 w-4" />
                View cart
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="shell py-8 sm:py-10">
        {!batch ? (
          <div className="premium-panel grid gap-5 p-5 md:grid-cols-[1.4fr_0.6fr]">
            <div>
              <span className="badge-warm">Closed</span>
              <h2 className="mt-4 text-2xl font-black text-stone-950">Preorders are closed right now.</h2>
              <p className="mt-2 leading-7 text-stone-600">Please check back later or text us for the next seasonal batch.</p>
              <a href={`sms:${CONTACT_PHONE_E164}`} className="btn-secondary mt-5 rounded-full"><MessageCircle className="h-4 w-4" /> Text us</a>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <Clock className="h-5 w-5 text-leaf-700" />
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-stone-500">Next step</p>
              <p className="mt-1 font-black text-stone-950">Wait for the next open preorder.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[1fr_280px] lg:items-start">
            <div className="space-y-8">
              {groupedProducts.map((group: any) => (
                <section key={group.category}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-stone-950">{group.category}</h2>
                      <p className="text-sm font-semibold text-stone-500">{group.products.length} preorder items</p>
                    </div>
                    <span className="badge-good">{group.products.length}</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {group.products.map((product: any, index: number) => (
                      <article key={product.id} className="premium-card group overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-leaf-100 hover:shadow-lift">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-leaf-700">{product.category}</p>
                            <h3 className="mt-1 text-xl font-black text-stone-950">{product.name}</h3>
                          </div>
                          <span className="rounded-full bg-stone-950 px-3 py-1 text-sm font-black text-white">{money(product.selling_price)}</span>
                        </div>
                        <p className="mt-3 min-h-12 text-sm leading-6 text-stone-600">{product.description || "Seasonal preorder item."}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-stone-500">
                          <span className="h-2 w-2 rounded-full bg-mango-500" />
                          Item {String(index + 1).padStart(2, "0")}
                        </div>
                        <AddToCart product={product} />
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <aside className="premium-card p-4 lg:sticky lg:top-24">
              <p className="eyebrow">Before checkout</p>
              <div className="mt-4 space-y-3 text-sm font-semibold leading-6 text-stone-700">
                <p className="flex gap-2"><CalendarDays className="mt-1 h-4 w-4 shrink-0 text-leaf-700" />Arrival: {formatDate(batch.expected_arrival_date)}</p>
                <p className="flex gap-2"><Clock className="mt-1 h-4 w-4 shrink-0 text-leaf-700" />Cutoff: {formatDate(batch.cutoff_date)}</p>
                <p className="rounded-2xl border border-mango-100 bg-mango-50 p-3">Send e-transfer to <strong>{ETRANSFER_EMAIL}</strong> before submitting.</p>
                <p className="rounded-2xl border border-stone-200 bg-stone-50 p-3">Pickup: <strong>{PICKUP_ADDRESS}</strong></p>
              </div>
              <Link href="/cart" className="btn-accent mt-4 w-full rounded-full">Review cart <ArrowRight className="h-4 w-4" /></Link>
            </aside>
          </div>
        )}
      </div>

      {batch && (
        <div className="fixed inset-x-3 bottom-3 z-30 sm:hidden">
          <Link href="/cart" className="btn-accent w-full rounded-full shadow-lift">
            <ShoppingBag className="h-4 w-4" />
            Review cart
          </Link>
        </div>
      )}
      <SiteFooter />
    </main>
  );
}

function formatDate(value: string | null) {
  if (!value) return "not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
