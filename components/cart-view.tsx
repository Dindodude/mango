"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { cartItemAccent, cartItemCode } from "@/lib/cart-visuals";
import { money } from "@/lib/utils";

export function CartView({ checkout = false }: { checkout?: boolean }) {
  const cart = useCart();
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  if (!cart.items.length) {
    return (
      <div className="surface p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-mango-100 text-leaf-700">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <p className="mt-4 text-lg font-black">Your cart is empty.</p>
        <p className="mt-1 text-sm text-stone-600">Choose your preorder items and they will appear here.</p>
        <Link href="/preorder" className="btn-primary mt-5">
          Choose items
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cart.items.map((item) => (
        <div key={item.productId} className="surface p-4 transition hover:shadow-lift">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className={`mb-2 inline-flex rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-wide ${cartItemAccent(item.productId)}`}>
                {cartItemCode(item.productId, item.name)}
              </span>
              <h3 className="font-black text-stone-950">{item.name}</h3>
              <p className="text-sm text-stone-600">
                {money(item.price)} each{item.category ? ` - ${item.category}` : ""}
              </p>
            </div>
            <p className="font-black text-stone-950">{money(item.price * item.quantity)}</p>
          </div>
          {!checkout && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex h-10 items-center overflow-hidden rounded-md border border-stone-200 bg-white shadow-crisp">
                <button type="button" className="grid h-full w-10 place-items-center text-stone-500 transition hover:bg-stone-50" onClick={() => cart.setQuantity(item.productId, item.quantity - 1)} aria-label={`Decrease ${item.name}`}>
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-black">{item.quantity}</span>
                <button type="button" className="grid h-full w-10 place-items-center text-stone-500 transition hover:bg-stone-50" onClick={() => cart.setQuantity(item.productId, item.quantity + 1)} aria-label={`Increase ${item.name}`}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button type="button" className="rounded-md border border-red-100 bg-red-50 p-2 text-red-700 transition hover:bg-red-100" onClick={() => cart.remove(item.productId)} aria-label={`Remove ${item.name}`}>
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          )}
          {checkout && <p className="mt-2 text-sm font-semibold text-stone-600">Quantity: {item.quantity}</p>}
        </div>
      ))}
      <div key={cart.total} className="rounded-lg bg-stone-950 p-5 text-white shadow-lift animate-total-pop">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-300">Subtotal</span>
          <span className="font-semibold">{money(cart.total)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-lg font-black">
          <span>Total</span>
          <span>{money(cart.total)}</span>
        </div>
      </div>
      {!checkout && (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link href="/preorder" className="btn-secondary">Continue shopping</Link>
            <button type="button" onClick={cart.clear} className="btn-secondary">Clear cart</button>
            <Link href="/checkout" className="btn-accent">Checkout</Link>
          </div>
          <div className="fixed inset-x-3 bottom-3 z-40 rounded-lg border border-white/20 bg-stone-950 p-3 text-white shadow-lift sm:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-stone-400">{itemCount} items</p>
                <p key={cart.total} className="text-lg font-black animate-total-pop">{money(cart.total)}</p>
              </div>
              <Link href="/checkout" className="btn-accent min-h-10 px-4 py-2">
                Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
