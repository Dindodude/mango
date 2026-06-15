import Link from "next/link";
import { CalendarDays, Clock, MapPin, MessageCircle, ShieldCheck, ShoppingBasket, Truck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { CONTACT_PHONE_E164, ETRANSFER_EMAIL, PICKUP_ADDRESS } from "@/lib/constants";

export default async function HomePage() {
  const supabase = hasSupabaseConfig() ? await createClient() : null;
  const activeBatch = supabase
    ? (await supabase.from("batches").select("batch_name,cutoff_date,expected_arrival_date").eq("status", "Active").maybeSingle()).data
    : null;

  return (
    <main>
      <SiteHeader />
      <section
        className="relative min-h-[70svh] overflow-hidden bg-stone-950"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(18,24,18,0.86), rgba(18,24,18,0.54), rgba(18,24,18,0.18)), url('https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1800&q=90')",
          backgroundPosition: "center",
          backgroundSize: "cover"
        }}
      >
        <div className="shell flex min-h-[70svh] items-center py-14">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] backdrop-blur">
              <Clock className="h-4 w-4 text-mango-300" />
              Seasonal preorder
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] md:text-6xl">
              Fresh mangoes, preordered in minutes.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 md:text-lg">
              Choose your items, send e-transfer, and submit your preorder. We check payment and confirm soon.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/preorder" className="btn-accent">
                <ShoppingBasket className="h-4 w-4" />
                Start preorder
              </Link>
              <a href={`sms:${CONTACT_PHONE_E164}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
                <MessageCircle className="h-4 w-4" />
                Text us
              </a>
            </div>
            <p className="mt-5 max-w-lg text-sm font-medium text-white/70">
              This is a preorder request. Your order is not confirmed until payment is checked.
            </p>
          </div>
        </div>
      </section>

      <section className="shell -mt-8 relative z-10">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoCard icon={<CalendarDays />} title="Current Preorder">
            {activeBatch ? (
              <>
                <p className="font-black text-stone-950">{activeBatch.batch_name}</p>
                <p>Order by {activeBatch.cutoff_date}</p>
                <p>Expected arrival {activeBatch.expected_arrival_date}</p>
              </>
            ) : (
              <p>Preorders are currently closed. Please check back later.</p>
            )}
          </InfoCard>
          <InfoCard icon={<MapPin />} title="Pickup">
            <p className="font-black text-stone-950">{PICKUP_ADDRESS}</p>
            <p>Pickup details are shared here and by message.</p>
          </InfoCard>
          <InfoCard icon={<ShieldCheck />} title="Payment">
            <p>Send e-transfer to</p>
            <p className="font-black text-leaf-700">{ETRANSFER_EMAIL}</p>
          </InfoCard>
        </div>
      </section>

      <section className="shell py-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 text-3xl font-black text-stone-950">A simple preorder flow.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-stone-600">
            The preorder stays short and clear from item selection to pickup details.
          </p>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {[
            ["Select items", "Choose products and quantities."],
            ["Send payment", "Send the e-transfer before checkout."],
            ["Get confirmation", "We check payment and confirm soon."],
            ["Pickup shared", "Pickup details are kept clear."],
            ["Admin verifies", "Payment is checked manually."],
            ["Order completed", "Ready and completed statuses stay organized."]
          ].map(([title, body], index) => (
            <div key={title} className="surface p-5">
              <span className="badge-good">Step {index + 1}</span>
              <h3 className="mt-4 font-black text-stone-950">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="shell grid gap-8 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Fresh batches</p>
            <h2 className="mt-2 text-3xl font-black text-stone-950">Built for seasonal mango runs.</h2>
            <p className="mt-3 leading-7 text-stone-600">
              Preorders open in batches every one to two weeks. No stock counters, no accounts, and no complicated checkout.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Checkout time" value="< 2 min" />
            <Stat label="Order type" value="Preorder" />
            <Stat label="Pickup" value="Vernon Powell" />
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-2 text-3xl font-black text-stone-950">Quick answers.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Faq q="Do I need an account?" a="No. You only need your name and phone number." />
            <Faq q="Is my order confirmed right away?" a="No. We check your payment first and confirm soon." />
            <Faq q="Can I change quantity?" a="Before checkout, yes. After checkout, please text us." />
            <Faq q="Where is pickup?" a={PICKUP_ADDRESS} />
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="surface p-5 shadow-lift">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-mango-100 text-leaf-700">{icon}</div>
      <h2 className="font-black text-stone-950">{title}</h2>
      <div className="mt-2 space-y-1 text-sm leading-6 text-stone-600">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-muted p-5">
      <p className="text-xs font-black uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-stone-950">{value}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="surface p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-leaf-50 text-leaf-700">
        <Truck className="h-4 w-4" />
      </div>
      <h3 className="font-black text-stone-950">{q}</h3>
      <p className="mt-1 text-sm leading-6 text-stone-600">{a}</p>
    </div>
  );
}
