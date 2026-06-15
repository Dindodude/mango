import { CartView } from "@/components/cart-view";
import { CheckoutForm } from "@/components/checkout-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCustomerSession } from "@/lib/customer";

export default async function CheckoutPage() {
  const session = await getCustomerSession();
  return (
    <main>
      <SiteHeader />
      <div className="shell grid gap-6 py-8 sm:py-10 md:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="eyebrow">Payment first</p>
          <h1 className="mb-5 mt-2 text-3xl font-black text-stone-950 sm:text-4xl">Checkout.</h1>
          <p className="mb-5 text-sm font-semibold leading-6 text-stone-600">Send e-transfer first, then submit your preorder. We email your order details and confirm again after payment is checked.</p>
          <CartView checkout />
        </section>
        <section className="md:pt-16">
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
