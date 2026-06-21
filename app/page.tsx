import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Truck,
  UserRound
} from "lucide-react";
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
    <main className="public-page">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="public-ambient" />
        <div className="shell relative grid min-h-[76svh] gap-8 py-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl reveal-up">
            <div className="seasonal-chip">
              <Sparkles className="h-4 w-4 text-mango-500" />
              Neighbourhood seasonal preorder
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
              Mango preorders, made simple.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-stone-700 sm:text-lg">
              Pick your fruit, send the e-transfer, and get a clean order confirmation. No account needed, no checkout confusion, just a reliable local preorder.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/preorder" className="btn-accent rounded-full px-5">
                <ShoppingBasket className="h-4 w-4" />
                Start Preorder
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={`sms:${CONTACT_PHONE_E164}`} className="btn-secondary rounded-full px-5">
                <MessageCircle className="h-4 w-4" />
                Text us
              </a>
              <Link href="/account" className="btn-secondary rounded-full px-5">
                <UserRound className="h-4 w-4" />
                My orders
              </Link>
            </div>
            <div className="mt-7 grid max-w-xl gap-2 text-sm font-semibold text-stone-600 sm:grid-cols-3">
              <TrustPill icon={<ShieldCheck className="h-4 w-4" />} label="Payment checked" />
              <TrustPill icon={<Clock className="h-4 w-4" />} label="Under 2 minutes" />
              <TrustPill icon={<Truck className="h-4 w-4" />} label="Local pickup" />
            </div>
          </div>

          <div className="reveal-up reveal-delay-1">
            <div className="premium-panel relative overflow-hidden p-4 sm:p-5">
              <div className="absolute right-5 top-5 h-24 w-24 rounded-full bg-mango-100/70 blur-2xl" />
              <div className="relative rounded-2xl border border-stone-200 bg-[#fffaf0] p-5">
                <span className={activeBatch ? "badge-good" : "badge-warm"}>{activeBatch ? "Open now" : "Closed"}</span>
                <h2 className="mt-4 text-2xl font-black text-stone-950">{activeBatch ? activeBatch.batch_name : "No active preorder"}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-stone-600">
                  {activeBatch
                    ? `Expected arrival ${formatDisplayDate(activeBatch.expected_arrival_date)}. Order by ${formatDisplayDate(activeBatch.cutoff_date)}.`
                    : "Please check back soon or text us for the next fruit run."}
                </p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <MiniInfo icon={<CreditCard className="h-5 w-5" />} label="E-transfer" value={ETRANSFER_EMAIL} />
                <MiniInfo icon={<MapPin className="h-5 w-5" />} label="Pickup" value={PICKUP_ADDRESS} />
              </div>
              <div className="mt-3 rounded-2xl border border-leaf-100 bg-leaf-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-leaf-700">Important</p>
                <p className="mt-1 text-sm font-bold leading-6 text-stone-800">
                  This is a preorder request. Your order is confirmed after payment is checked.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent" />
      </section>

      <section className="shell py-10">
        <div className="grid gap-3 md:grid-cols-3">
          <InfoCard icon={<CalendarDays />} title="Current Preorder">
            {activeBatch ? (
              <>
                <p className="font-black text-stone-950">{activeBatch.batch_name}</p>
                <p>Order by {formatDisplayDate(activeBatch.cutoff_date)}</p>
                <p>Expected arrival {formatDisplayDate(activeBatch.expected_arrival_date)}</p>
              </>
            ) : (
              <p>Preorders are currently closed. Please check back later.</p>
            )}
          </InfoCard>
          <InfoCard icon={<MapPin />} title="Pickup">
            <p className="font-black text-stone-950">{PICKUP_ADDRESS}</p>
            <p>Pickup details stay visible on your order page.</p>
          </InfoCard>
          <InfoCard icon={<CreditCard />} title="Payment">
            <p>Send e-transfer before submitting.</p>
            <p className="font-black text-leaf-700">{ETRANSFER_EMAIL}</p>
          </InfoCard>
        </div>
      </section>

      <section className="shell py-14 sm:py-16">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">Six clear steps.</h2>
          </div>
          <p className="max-w-xl text-sm font-semibold leading-6 text-stone-600">
            Designed for neighbours ordering quickly on a phone.
          </p>
        </div>
        <div className="mt-7 grid gap-3 md:grid-cols-3">
          {[
            ["Select items", "Choose items and quantities."],
            ["Send payment", "E-transfer before submitting."],
            ["Submit preorder", "Add your name, phone, and email."],
            ["We check payment", "Orders are reviewed manually."],
            ["Confirmation arrives", "You get the order details by email."],
            ["Pickup", "Pickup details stay simple and clear."]
          ].map(([title, body], index) => (
            <div key={title} className="premium-card p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-leaf-700 text-sm font-black text-white">{index + 1}</span>
              <h3 className="mt-4 font-black text-stone-950">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white/72">
        <div className="shell grid gap-8 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Local trust</p>
            <h2 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">A preorder system for real fruit runs.</h2>
            <p className="mt-3 leading-7 text-stone-600">
              Products change by batch, payment is still e-transfer, and order history is optional. The goal is simple: make the weekly mango run easier to manage.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Checkout" value="< 2 min" />
            <Stat label="Order type" value="Preorder" />
            <Stat label="Pickup" value="Oakville" />
          </div>
        </div>
      </section>

      <section className="shell py-14 sm:py-16">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-2 text-3xl font-black text-stone-950">Quick answers.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Faq q="Do I need an account?" a="No. Guest checkout works." />
            <Faq q="Is my order confirmed right away?" a="No. We check your payment first." />
            <Faq q="Can I change quantity?" a="Before checkout, yes. After checkout, text us." />
            <Faq q="Where is pickup?" a={PICKUP_ADDRESS} />
          </div>
        </div>
      </section>

      <div className="fixed inset-x-3 bottom-3 z-30 sm:hidden">
        <Link href="/preorder" className="btn-accent w-full rounded-full shadow-lift">
          <ShoppingBasket className="h-4 w-4" />
          Start Preorder
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}

function TrustPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/75 px-3 py-2 text-stone-700 shadow-crisp">
      <span className="text-leaf-700">{icon}</span>
      {label}
    </span>
  );
}

function MiniInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-crisp">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mango-100 text-leaf-700">{icon}</div>
      <p className="mt-3 text-xs font-black uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 font-black text-stone-950 wrap-anywhere">{value}</p>
    </div>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="premium-card p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-mango-100 text-leaf-700">{icon}</div>
      <h2 className="font-black text-stone-950">{title}</h2>
      <div className="mt-2 space-y-1 text-sm leading-6 text-stone-600">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-mango-100 bg-mango-50/80 p-5">
      <p className="text-xs font-black uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-stone-950">{value}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="premium-card p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700">
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <h3 className="font-black text-stone-950">{q}</h3>
      <p className="mt-1 text-sm leading-6 text-stone-600">{a}</p>
    </div>
  );
}

function formatDisplayDate(value: string | null) {
  if (!value) return "not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
