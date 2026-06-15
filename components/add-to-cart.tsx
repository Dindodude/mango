"use client";

import { useState } from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";

type Props = {
  product: { id: string; name: string; category?: string; selling_price: number };
};

export function AddToCart({ product }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const cart = useCart();

  return (
    <div className="mt-5 flex items-center gap-3">
      <div className="flex h-11 items-center overflow-hidden rounded-md border border-stone-200 bg-white shadow-crisp">
        <button className="grid h-full w-10 place-items-center text-stone-500 transition hover:bg-stone-50 hover:text-stone-950" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-11 text-center text-sm font-black">{quantity}</span>
        <button className="grid h-full w-10 place-items-center text-stone-500 transition hover:bg-stone-50 hover:text-stone-950" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <button
        className="btn-primary flex-1"
        onClick={() => {
          cart.add({ productId: product.id, name: product.name, category: product.category, price: product.selling_price }, quantity);
          setAdded(true);
          setTimeout(() => setAdded(false), 1300);
        }}
      >
        <ShoppingCart className="h-4 w-4" />
        {added ? "Added" : "Add to cart"}
      </button>
      {added && <span className="hidden rounded-md bg-leaf-50 px-2 py-1 text-xs font-black text-leaf-700 sm:inline">Added</span>}
    </div>
  );
}
