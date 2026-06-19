import { CalendarPlus, Download } from "lucide-react";
import { AdminBatchForm } from "@/components/admin-batch-form";
import { AdminPageHeader, AdminPanel, MetricCard, StatusBadge } from "@/components/admin-ui";
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
      <AdminPageHeader eyebrow="Preorder windows" title="Batches" description="Only one batch can be active at a time. Arrival date can be written like June 15 2026." />

      <AdminPanel title="Create Batch" description="Create the next preorder window from one arrival date." action={<CalendarPlus className="h-5 w-5 text-leaf-700" />}>
        <AdminBatchForm />
      </AdminPanel>

      <div className="mt-5 space-y-4">
        {batches?.map((batch) => {
          const batchStats = stats(batch.id);
          return (
            <details key={batch.id} className="surface group overflow-hidden" open={batch.status === "Active"}>
              <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-stone-950">{batch.batch_name}</h2>
                    <StatusBadge status={batch.status} />
                  </div>
                  <p className="text-sm font-semibold text-stone-500">{batch.batch_code}</p>
                  <p className="mt-1 text-sm text-stone-600">Arrival {batch.expected_arrival_date} - Cutoff {batch.cutoff_date}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[620px]">
                  <MetricCard label="Orders" value={batchStats.orders} />
                  <MetricCard label="Paid" value={batchStats.paid} tone="good" />
                  <MetricCard label="Revenue" value={money(batchStats.revenue)} />
                  <MetricCard label="Profit" value={money(batchStats.profit)} tone="good" />
                </div>
              </summary>
              <div className="border-t border-stone-100 p-5">
                <div className="mb-4 grid gap-2 sm:grid-cols-4">
                  <ExportLink href={`/api/admin/export/batch-paid?batchId=${batch.id}`} label="Paid CSV" />
                  <ExportLink href={`/api/admin/export/supplier?batchId=${batch.id}`} label="Supplier" />
                  <ExportLink href={`/api/admin/export/pickup?batchId=${batch.id}`} label="Pickup" />
                  <ExportLink href={`/api/admin/export/problem?batchId=${batch.id}`} label="Problems" />
                </div>
                <AdminBatchForm batch={batch} />
              </div>
            </details>
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
