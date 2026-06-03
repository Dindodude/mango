"use client";

import { useFormState } from "react-dom";
import { saveProduct, type AdminActionState } from "@/app/actions";
import { productCategories } from "@/lib/constants";
import { money } from "@/lib/utils";
import { AdminFormButton } from "@/components/admin-form-button";

const initialState: AdminActionState = { ok: false, message: "" };

export function AdminProductForm({ product }: { product?: any }) {
  const [state, formAction] = useFormState(saveProduct, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input name="name" defaultValue={product?.name} placeholder="Name" required className="field" />
      <select name="category" defaultValue={product?.category ?? productCategories[0]} className="field">
        {productCategories.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>
      <input name="selling_price" type="number" step="0.01" defaultValue={product?.selling_price ?? ""} placeholder="Selling price" required className="field" />
      <input name="cost_price" type="number" step="0.01" defaultValue={product?.cost_price ?? ""} placeholder="Cost price" required className="field" />
      <input name="image_url" defaultValue={product?.image_url ?? ""} placeholder="Image URL" className="field sm:col-span-2" />
      <textarea name="description" defaultValue={product?.description ?? ""} placeholder="Description" className="field sm:col-span-2" />
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
