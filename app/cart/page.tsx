import { CartView } from "@/components/cart-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function CartPage() {
  return (
    <main>
      <SiteHeader />
      <div className="shell max-w-3xl py-8 sm:py-10">
        <p className="eyebrow">Review</p>
        <h1 className="mb-6 mt-2 text-3xl font-black text-stone-950 sm:text-4xl">Your preorder cart.</h1>
        <CartView />
      </div>
      <SiteFooter />
    </main>
  );
}
