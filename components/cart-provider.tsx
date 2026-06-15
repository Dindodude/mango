"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/lib/types";

type CartContextValue = {
  items: CartLine[];
  add: (line: Omit<CartLine, "quantity">, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const key = "mango-preorder-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);

  useEffect(() => {
    const saved = window.localStorage.getItem(key);
    if (saved) {
      // Cart storage is temporary customer convenience; final orders are saved in Supabase.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      items,
      total,
      add(line, quantity) {
        setItems((current) => {
          const existing = current.find((item) => item.productId === line.productId);
          if (existing) {
            return current.map((item) =>
              item.productId === line.productId ? { ...item, quantity: item.quantity + quantity } : item
            );
          }
          return [...current, { ...line, quantity }];
        });
      },
      setQuantity(productId, quantity) {
        setItems((current) =>
          current
            .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item))
            .filter((item) => item.quantity > 0)
        );
      },
      remove(productId) {
        setItems((current) => current.filter((item) => item.productId !== productId));
      },
      clear() {
        setItems([]);
        window.localStorage.removeItem(key);
      }
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
