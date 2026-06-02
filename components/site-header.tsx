import Link from "next/link";
import { Leaf, MessageCircle, ShoppingBasket } from "lucide-react";
import { CONTACT_PHONE_DIGITS, CONTACT_PHONE_E164 } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/88 backdrop-blur-xl">
      <div className="shell flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2 font-black text-stone-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-mango-500 text-leaf-900 shadow-crisp">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Mango Preorders</span>
          <span className="sm:hidden">Mango</span>
        </Link>
        <nav className="flex items-center gap-1.5 text-sm">
          <Link href="/preorder" className="rounded-md px-3 py-2 font-bold text-stone-700 transition hover:bg-leaf-50 hover:text-leaf-700">
            Preorder
          </Link>
          <Link href="/cart" className="rounded-md border border-stone-200 bg-white p-2 shadow-crisp transition hover:bg-mango-50" aria-label="Cart">
            <ShoppingBasket className="h-5 w-5" />
          </Link>
          <a
            href={`https://wa.me/${CONTACT_PHONE_DIGITS}`}
            className="btn-primary min-h-10 px-3 py-2"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" /> Text
            </span>
          </a>
          <a href={`sms:${CONTACT_PHONE_E164}`} className="sr-only">
            Send text
          </a>
        </nav>
      </div>
    </header>
  );
}
