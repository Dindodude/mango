import Link from "next/link";
import { CalendarDays, Clock, CreditCard, MapPin, MessageCircle, ShieldCheck, ShoppingBasket, Truck, UserRound } from "lucide-react";
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
      <section className="relative overflow-hidden border-b border-stone-200 bg-[#f7f5ee]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,166,35,0.24),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(47,93,39,0.14),transparent_30%)]" />
        <div className="shell relative grid min-h-[68svh] gap-10 py-12 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-leaf-100 bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-leaf-700 shadow-crisp">
              <Clock className="h-4 w-4 text-mango-300" />
              Seasonal preorder
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] text-stone-950 md:text-6xl">
              Preorder fruit without the back and forth.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-stone-700 md:text-lg">
              Choose items, pay by e-transfer, and track your order from the same simple account.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/preorder" className="btn-accent">
                <ShoppingBasket className="h-4 w-4" />
                Start preorder
              </Link>
              <a href={`sms:${CONTACT_PHONE_E164}`} className="btn-secondary">
                <MessageCircle className="h-4 w-4" />
                Text us
              </a>
              <Link href="/account" className="btn-secondary">
                <UserRound className="h-4 w-4" />
                My orders
              </Link>
            </div>
            <p className="mt-5 max-w-lg text-sm font-semibold text-stone-600">
              This is a preorder request. Your order is not confirmed until payment is checked.
            </p>
          </div>
          <div className="grid gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-lift">
            <div className="surface p-5 shadow-lift">
              <span className={activeBatch ? "badge-good" : "badge-warm"}>{activeBatch ? "Open now" : "Closed"}</span>
              <h2 className="mt-4 text-2xl font-black text-stone-950">{activeBatch ? activeBatch.batch_name : "No active preorder"}</h2>
              <p className="mt-2 text-sm font-semibold text-stone-600">
                {activeBatch ? `Expected arrival ${activeBatch.expected_arrival_date}` : "Please check back soon or text us."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="surface-muted p-4">
                <CreditCard className="h-5 w-5 text-leaf-700" />
                <p className="mt-3 text-xs font-black uppercase tracking-wide text-stone-500">Payment</p>
                <p className="mt-1 font-black text-stone-950">{ETRANSFER_EMAIL}</p>
              </div>
              <div className="surface-muted p-4">
                <MapPin className="h-5 w-5 text-leaf-700" />
                <p className="mt-3 text-xs font-black uppercase tracking-wide text-stone-500">Pickup</p>
                <p className="mt-1 font-black text-stone-950">{PICKUP_ADDRESS}</p>
              </div>
            </div>
            <div className="surface-muted p-4">
              <UserRound className="h-5 w-5 text-leaf-700" />
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-stone-500">Account</p>
              <p className="mt-1 font-black text-stone-950">Optional order history</p>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-8">
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
              Preorders open in batches every one to two weeks. Guest checkout stays fast, and optional accounts save order history.
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
