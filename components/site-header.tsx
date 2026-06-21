import Link from "next/link";
import { Leaf, MessageCircle, ShoppingBasket, UserRound } from "lucide-react";
import { CONTACT_PHONE_DIGITS, CONTACT_PHONE_E164 } from "@/lib/constants";
import { getCustomerSession } from "@/lib/customer";

export async function SiteHeader() {
  const session = await getCustomerSession();
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#fffdf7]/90 backdrop-blur-xl">
      <div className="shell flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2.5 font-black text-stone-950">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mango-500 text-leaf-900 shadow-crisp transition active:scale-95">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="hidden leading-tight sm:inline">
            Mango Preorders
            <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-leaf-700">Oakville</span>
          </span>
          <span className="sm:hidden">Mango</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-1.5">
          <Link href="/preorder" className="rounded-full px-3 py-2 font-bold text-stone-700 transition hover:bg-leaf-50 hover:text-leaf-700">
            Preorder
          </Link>
          <Link href={session.user ? "/account" : "/account/login"} className="rounded-full px-3 py-2 font-bold text-stone-700 transition hover:bg-leaf-50 hover:text-leaf-700">
            <span className="hidden sm:inline">{session.user ? "My orders" : "Sign in"}</span>
            <UserRound className="h-5 w-5 sm:hidden" />
          </Link>
          <Link href="/cart" className="rounded-full border border-stone-200 bg-white p-2 shadow-crisp transition hover:bg-mango-50 active:scale-95" aria-label="Cart">
            <ShoppingBasket className="h-5 w-5" />
          </Link>
          <a
            href={`https://wa.me/${CONTACT_PHONE_DIGITS}`}
            className="btn-primary min-h-10 rounded-full px-3 py-2"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Text</span>
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
