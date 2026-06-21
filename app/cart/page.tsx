import { CartView } from "@/components/cart-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function CartPage() {
  return (
    <main className="public-page">
      <SiteHeader />
      <div className="shell max-w-4xl py-8 sm:py-12">
        <div className="mb-6 reveal-up">
          <p className="eyebrow">Review</p>
          <h1 className="mt-2 text-4xl font-black text-stone-950 sm:text-5xl">Your preorder cart.</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-stone-600">
            Adjust quantities, then continue to payment-first checkout.
          </p>
        </div>
        <CartView />
      </div>
      <SiteFooter />
    </main>
  );
}
