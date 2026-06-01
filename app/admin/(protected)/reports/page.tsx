import { Download, LineChart, PackageSearch } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export default async function ReportsPage() {
  const supabase = createAdminClient();
  const [{ data: orders }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*,batches(batch_name)").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*")
  ]);

  const byBatch = Object.values((orders ?? []).reduce<Record<string, any>>((acc, order) => {
    const key = order.batches?.batch_name ?? "No batch";
    acc[key] ??= { name: key, revenue: 0, profit: 0, orders: 0, outstanding: 0 };
    acc[key].revenue += Number(order.total_amount);
    acc[key].profit += Number(order.total_profit);
    acc[key].orders += 1;
    acc[key].outstanding += order.payment_status === "Payment Verified" ? 0 : Number(order.total_amount);
    return acc;
  }, {}));

  const byProduct = Object.values((items ?? []).reduce<Record<string, any>>((acc, item) => {
    const key = item.product_name_snapshot;
    acc[key] ??= { name: key, quantity: 0, revenue: 0, profit: 0 };
    acc[key].quantity += Number(item.quantity);
    acc[key].revenue += Number(item.line_total);
    acc[key].profit += Number(item.line_profit);
    return acc;
  }, {}));

  return (
    <div className="admin-shell">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Analytics</p>
          <h1 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">Reports</h1>
          <p className="mt-1 text-sm font-semibold text-stone-600">Revenue, profit, supplier summaries, and unpaid exports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["orders", "unpaid", "supplier", "profit", "batches"].map((type) => (
            <a key={type} href={`/api/admin/export/${type}`} className="btn-secondary min-h-10 px-3 py-2 capitalize">
              <Download className="h-4 w-4" /> {type}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ReportTable icon={<LineChart className="h-5 w-5 text-leaf-700" />} title="Revenue by Batch" rows={byBatch} columns={["name", "orders", "revenue", "profit", "outstanding"]} />
        <ReportTable icon={<PackageSearch className="h-5 w-5 text-leaf-700" />} title="Profit by Product" rows={byProduct} columns={["name", "quantity", "revenue", "profit"]} />
      </div>
    </div>
  );
}

function ReportTable({ icon, title, rows, columns }: { icon: React.ReactNode; title: string; rows: any[]; columns: string[] }) {
  return (
    <section className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-stone-100 p-5">
        <h2 className="font-black text-stone-950">{title}</h2>
        {icon}
      </div>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[520px]">
          <thead>
            <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                {columns.map((column) => (
                  <td key={column} className={column === "profit" ? "font-bold text-leaf-700" : ""}>
                    {["revenue", "profit", "outstanding"].includes(column) ? money(row[column]) : row[column]}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center font-semibold text-stone-500">
                  No report data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
