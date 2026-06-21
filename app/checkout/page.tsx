import { CartView } from "@/components/cart-view";
import { CheckoutForm } from "@/components/checkout-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCustomerSession } from "@/lib/customer";

export default async function CheckoutPage() {
  const session = await getCustomerSession();
  return (
    <main className="public-page">
      <SiteHeader />
      <div className="shell grid gap-6 py-8 sm:py-12 lg:grid-cols-[0.86fr_1.14fr]">
        <section className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">Payment first</p>
          <h1 className="mt-2 text-4xl font-black text-stone-950 sm:text-5xl">Checkout.</h1>
          <div className="mt-5 rounded-2xl border border-mango-100 bg-mango-50/80 p-4 text-sm font-semibold leading-6 text-stone-700">
            Send the e-transfer first. Then submit this preorder so we can match your payment and confirm the order.
          </div>
          <div className="my-5 grid gap-2 text-sm font-bold text-stone-600 sm:grid-cols-3 lg:grid-cols-1">
            <span className="rounded-full border border-stone-200 bg-white px-3 py-2">1. Contact</span>
            <span className="rounded-full border border-stone-200 bg-white px-3 py-2">2. Payment</span>
            <span className="rounded-full border border-stone-200 bg-white px-3 py-2">3. Submit</span>
          </div>
          <CartView checkout />
        </section>
        <section>
          <CheckoutForm
            defaults={{
              customerName: session.profile?.full_name ?? "",
              customerEmail: session.user?.email ?? "",
              phone: session.profile?.phone ?? ""
            }}
            signedIn={Boolean(session.user)}
          />
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
