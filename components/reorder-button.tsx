"use client";

import { RotateCcw } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { CartLine } from "@/lib/types";

export function ReorderButton({ lines }: { lines: CartLine[] }) {
  const cart = useCart();
  if (!lines.length) {
    return <p className="rounded-md bg-stone-50 p-3 text-sm font-semibold text-stone-600">These items are not active right now.</p>;
  }

  return (
    <button
      type="button"
      className="btn-accent w-full sm:w-auto"
      onClick={() => {
        lines.forEach((line) => cart.add({ productId: line.productId, name: line.name, price: line.price, category: line.category }, line.quantity));
      }}
    >
      <RotateCcw className="h-4 w-4" />
      Reorder
    </button>
  );
}
