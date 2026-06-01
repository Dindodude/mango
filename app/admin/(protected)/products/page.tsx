import { ImageIcon, Plus, Trash2 } from "lucide-react";
import { deleteProduct, saveProduct } from "@/app/actions";
import { productCategories } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export default async function ProductsPage() {
  const { data: products } = await createAdminClient().from("products").select("*").order("display_order");
  return (
    <div className="admin-shell">
      <div>
        <p className="eyebrow">Catalog</p>
        <h1 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">Products</h1>
        <p className="mt-1 text-sm font-semibold text-stone-600">Manage preorder items, prices, costs, and display order.</p>
      </div>

      <section className="surface mt-5 p-5">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-leaf-700" />
          <h2 className="font-black text-stone-950">Add Product</h2>
        </div>
        <ProductForm />
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {products?.map((product) => (
          <section key={product.id} className="surface overflow-hidden">
            <div className="flex items-center gap-4 border-b border-stone-100 p-4">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-16 w-16 rounded-md object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-md bg-mango-50 text-leaf-700">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate font-black text-stone-950">{product.name}</h2>
                <p className="text-sm font-semibold text-stone-500">
                  {product.category} - {money(product.selling_price)}
                </p>
              </div>
              <span className={product.active ? "badge-good ml-auto" : "badge ml-auto"}>{product.active ? "Active" : "Inactive"}</span>
            </div>
            <div className="p-5">
              <ProductForm product={product} />
              <form action={deleteProduct} className="mt-3">
                <input type="hidden" name="id" value={product.id} />
                <button className="inline-flex items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </form>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ProductForm({ product }: { product?: any }) {
  return (
    <form action={saveProduct} className="mt-4 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input name="name" defaultValue={product?.name} placeholder="Name" required className="field" />
      <select name="category" defaultValue={product?.category ?? productCategories[0]} className="field">
        {productCategories.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>
      <input name="selling_price" type="number" step="0.01" defaultValue={product?.selling_price ?? ""} placeholder="Selling price" required className="field" />
      <input name="cost_price" type="number" step="0.01" defaultValue={product?.cost_price ?? ""} placeholder="Cost price" required className="field" />
      <input name="display_order" type="number" defaultValue={product?.display_order ?? 0} placeholder="Display order" className="field" />
      <input name="image_url" defaultValue={product?.image_url ?? ""} placeholder="Image URL" className="field" />
      <textarea name="description" defaultValue={product?.description ?? ""} placeholder="Description" className="field sm:col-span-2" />
      <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-bold text-stone-700">
        <input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Active
      </label>
      <div className="flex items-center rounded-md bg-leaf-50 px-3 py-2 text-sm font-bold text-leaf-700">
        {product ? `Profit/unit: ${money(Number(product.selling_price) - Number(product.cost_price))}` : "Profit/unit calculated after save"}
      </div>
      <button className="btn-primary sm:col-span-2">Save product</button>
    </form>
  );
}
