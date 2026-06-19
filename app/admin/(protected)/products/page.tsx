import { DollarSign, Plus, Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/actions";
import { AdminProductForm } from "@/components/admin-product-form";
import { AdminPageHeader, AdminPanel } from "@/components/admin-ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export default async function ProductsPage() {
  const { data: products } = await createAdminClient().from("products").select("*").order("display_order");
  const activeCount = products?.filter((product) => product.active).length ?? 0;
  return (
    <div className="admin-shell">
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description={`${products?.length ?? 0} products, ${activeCount} active. No inventory quantities are tracked.`}
      />

      <AdminPanel
        title="Add Product"
        description="Add preorder items with selling price, cost, and category."
        action={<Plus className="h-5 w-5 text-leaf-700" />}
      >
        <AdminProductForm />
      </AdminPanel>

      <div className="mt-5 space-y-3">
        {products?.map((product) => (
          <details key={product.id} className="surface group overflow-hidden">
            <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-black text-stone-950">{product.name}</h2>
                  <span className={product.active ? "badge-good" : "badge"}>{product.active ? "Active" : "Inactive"}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-stone-500">{product.category}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-right text-sm sm:min-w-[360px]">
                <MiniStat label="Sell" value={money(product.selling_price)} />
                <MiniStat label="Cost" value={money(product.cost_price)} />
                <MiniStat label="Profit" value={money(Number(product.selling_price) - Number(product.cost_price))} good />
              </div>
            </summary>
            <div className="border-t border-stone-100 p-5">
              <AdminProductForm product={product} />
              <form action={deleteProduct} className="mt-3">
                <input type="hidden" name="id" value={product.id} />
                <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </form>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, good = false }: { label: string; value: React.ReactNode; good?: boolean }) {
  return (
    <div className="rounded-md bg-stone-50 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-1 flex items-center justify-end gap-1 font-black ${good ? "text-leaf-700" : "text-stone-950"}`}>
        {good && <DollarSign className="h-3 w-3" />}
        {value}
      </p>
    </div>
  );
}
