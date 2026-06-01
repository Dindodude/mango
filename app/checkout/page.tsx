import { CartView } from "@/components/cart-view";
import { CheckoutForm } from "@/components/checkout-form";
import { SiteHeader } from "@/components/site-header";

export default function CheckoutPage() {
  return (
    <main>
      <SiteHeader />
      <div className="shell grid gap-6 py-8 sm:py-10 md:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="eyebrow">Payment first</p>
          <h1 className="mb-5 mt-2 text-3xl font-black text-stone-950 sm:text-4xl">Checkout.</h1>
          <CartView checkout />
        </section>
        <section className="md:pt-16">
          <CheckoutForm />
        </section>
      </div>
    </main>
  );
}
