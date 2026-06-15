import { CalendarPlus, Download } from "lucide-react";
import { AdminBatchForm } from "@/components/admin-batch-form";
import { AdminSectionHeader, MetricCard, StatusBadge } from "@/components/admin-ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export default async function BatchesPage() {
  const supabase = createAdminClient();
  const [{ data: batches }, { data: orders }] = await Promise.all([
    supabase.from("batches").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("batch_id,payment_status,order_status,total_amount,total_profit").neq("order_status", "Cancelled")
  ]);

  function stats(batchId: string) {
    const batchOrders = (orders ?? []).filter((order) => order.batch_id === batchId);
    return {
      orders: batchOrders.length,
      paid: batchOrders.filter((order) => order.payment_status === "Payment Verified").length,
      revenue: batchOrders.reduce((sum, order) => sum + Number(order.total_amount), 0),
      profit: batchOrders.reduce((sum, order) => sum + Number(order.total_profit), 0)
    };
  }

  return (
    <div className="admin-shell">
      <AdminSectionHeader eyebrow="Preorder windows" title="Batches" description="Only one batch can be active at a time." />

      <section className="surface mt-5 p-5">
        <div className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-leaf-700" />
          <h2 className="font-black text-stone-950">Create Batch</h2>
        </div>
        <AdminBatchForm />
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {batches?.map((batch) => {
          const batchStats = stats(batch.id);
          return (
            <section key={batch.id} className="surface p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black text-stone-950">{batch.batch_name}</h2>
                  <p className="text-sm font-semibold text-stone-500">{batch.batch_code}</p>
                  <p className="mt-1 text-sm text-stone-600">Arrival {batch.expected_arrival_date} - Cutoff {batch.cutoff_date}</p>
                </div>
                <StatusBadge status={batch.status} />
              </div>
              <div className="grid gap-2 sm:grid-cols-4">
                <MetricCard label="Orders" value={batchStats.orders} />
                <MetricCard label="Paid" value={batchStats.paid} tone="good" />
                <MetricCard label="Revenue" value={money(batchStats.revenue)} />
                <MetricCard label="Profit" value={money(batchStats.profit)} tone="good" />
              </div>
              <div className="my-4 grid gap-2 sm:grid-cols-4">
                <ExportLink href={`/api/admin/export/batch-paid?batchId=${batch.id}`} label="Paid CSV" />
                <ExportLink href={`/api/admin/export/supplier?batchId=${batch.id}`} label="Supplier" />
                <ExportLink href={`/api/admin/export/pickup?batchId=${batch.id}`} label="Pickup" />
                <ExportLink href={`/api/admin/export/problem?batchId=${batch.id}`} label="Problems" />
              </div>
              <AdminBatchForm batch={batch} />
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ExportLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="btn-secondary min-h-10 px-3 py-2 text-xs">
      <Download className="h-4 w-4" />
      {label}
    </a>
  );
}
