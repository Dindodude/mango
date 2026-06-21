"use client";

import { useActionState } from "react";
import { saveProduct, type AdminActionState } from "@/app/actions";
import { productCategories } from "@/lib/constants";
import { money } from "@/lib/utils";
import { AdminFormButton } from "@/components/admin-form-button";

const initialState: AdminActionState = { ok: false, message: "" };

export function AdminProductForm({ product }: { product?: any }) {
  const [state, formAction] = useActionState(saveProduct, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <label>
        <span className="label mb-1.5 block">Product name</span>
        <input name="name" defaultValue={product?.name} placeholder="Sindri" required className="field" />
      </label>
      <label>
        <span className="label mb-1.5 block">Category</span>
        <select name="category" defaultValue={product?.category ?? productCategories[0]} className="field">
          {productCategories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="label mb-1.5 block">Selling price</span>
        <input name="selling_price" type="number" step="0.01" defaultValue={product?.selling_price ?? ""} placeholder="26" required className="field" />
      </label>
      <label>
        <span className="label mb-1.5 block">Cost price</span>
        <input name="cost_price" type="number" step="0.01" defaultValue={product?.cost_price ?? ""} placeholder="23" required className="field" />
      </label>
      <label>
        <span className="label mb-1.5 block">Display order</span>
        <input name="display_order" type="number" min="0" step="1" defaultValue={product?.display_order ?? 0} placeholder="0" className="field" />
      </label>
      <div className="flex items-center rounded-md bg-stone-50 px-3 py-2 text-sm font-bold text-stone-600">
        Lower numbers show first.
      </div>
      <label className="sm:col-span-2">
        <span className="label mb-1.5 block">Description</span>
        <textarea name="description" defaultValue={product?.description ?? ""} placeholder="Optional customer-facing description" className="field" />
      </label>
      <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-bold text-stone-700">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Active
      </label>
      <div className="flex items-center rounded-md bg-leaf-50 px-3 py-2 text-sm font-bold text-leaf-700">
        {product ? `Profit/unit: ${money(Number(product.selling_price) - Number(product.cost_price))}` : "Profit/unit calculated after save"}
      </div>
      {state.message && (
        <p className={`rounded-md border p-3 text-sm font-semibold sm:col-span-2 ${state.ok ? "border-leaf-100 bg-leaf-50 text-leaf-700" : "border-red-100 bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}
      <AdminFormButton label="Save product" />
    </form>
  );
}
