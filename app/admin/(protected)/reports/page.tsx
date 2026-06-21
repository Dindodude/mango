import { Download, LineChart, PackageSearch, Truck } from "lucide-react";
import { AdminPageHeader, AdminPanel } from "@/components/admin-ui";
import { CopyButton } from "@/components/copy-button";
import { EmailTestForm } from "@/components/email-test-form";
import { emailConfigStatus } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { money } from "@/lib/utils";

export default async function ReportsPage() {
  const supabase = createAdminClient();
  const [{ data: orders }, { data: items }, { data: activeBatch }] = await Promise.all([
    supabase.from("orders").select("*,batches(id,batch_name)").neq("order_status", "Cancelled").order("created_at", { ascending: false }),
    supabase.from("order_items").select("*,orders!inner(payment_status,order_status,batch_id,batches(batch_name))").eq("orders.payment_status", "Payment Verified").neq("orders.order_status", "Cancelled"),
    supabase.from("batches").select("*").eq("status", "Active").maybeSingle()
  ]);
  const emailConfig = emailConfigStatus();
  const emailFailures = (orders ?? []).filter((order: any) => order.last_email_error).slice(0, 6);

  const byBatch = Object.values((orders ?? []).reduce<Record<string, any>>((acc, order) => {
    const key = order.batches?.batch_name ?? "No batch";
    acc[key] ??= { name: key, revenue: 0, profit: 0, orders: 0, outstanding: 0 };
    acc[key].revenue += Number(order.total_amount);
    acc[key].profit += Number(order.total_profit);
    acc[key].orders += 1;
    acc[key].outstanding += order.payment_status === "Payment Verified" ? 0 : Number(order.total_amount);
    return acc;
  }, {}));

  const supplier = Object.values((items ?? []).reduce<Record<string, any>>((acc, item) => {
    const key = `${item.orders?.batches?.batch_name ?? "No batch"}-${item.product_name_snapshot}`;
    acc[key] ??= { batch: item.orders?.batches?.batch_name ?? "No batch", name: item.product_name_snapshot, quantity: 0, revenue: 0, profit: 0 };
    acc[key].quantity += Number(item.quantity);
    acc[key].revenue += Number(item.line_total);
    acc[key].profit += Number(item.line_profit);
    return acc;
  }, {})).sort((a, b) => a.batch.localeCompare(b.batch) || b.quantity - a.quantity);

  const activeSupplier = supplier.filter((row: any) => !activeBatch || row.batch === activeBatch.batch_name);
  const supplierTotals = Object.values(activeSupplier.reduce<Record<string, any>>((acc, row: any) => {
    acc[row.name] ??= { name: row.name, quantity: 0 };
    acc[row.name].quantity += Number(row.quantity);
    return acc;
  }, {})).sort((a: any, b: any) => b.quantity - a.quantity || a.name.localeCompare(b.name));
  const supplierText = supplierTotals.map((row: any) => `${row.name}: ${row.quantity}`).join("\n");

  return (
    <div className="admin-shell">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Reports"
        description="Revenue, profit, supplier summaries, email health, and exports."
        action={(
          <>
          {["orders", "unpaid"].map((type) => (
            <a key={type} href={`/api/admin/export/${type}`} className="btn-secondary min-h-10 px-3 py-2 capitalize">
              <Download className="h-4 w-4" /> {type}
            </a>
          ))}
          {activeBatch && (
            <>
              <a href={`/api/admin/export/supplier?batchId=${activeBatch.id}`} className="btn-primary min-h-10 px-3 py-2"><Truck className="h-4 w-4" /> Supplier CSV</a>
              <a href={`/api/admin/export/pickup?batchId=${activeBatch.id}`} className="btn-secondary min-h-10 px-3 py-2"><Download className="h-4 w-4" /> Pickup CSV</a>
              <a href={`/api/admin/export/problem?batchId=${activeBatch.id}`} className="btn-secondary min-h-10 px-3 py-2"><Download className="h-4 w-4" /> Problems</a>
            </>
          )}
          </>
        )}
      />

      <div className="mt-5">
        <AdminPanel
          title="Supplier Summary"
          description={`Verified paid orders only${activeBatch ? ` for ${activeBatch.batch_name}` : ""}.`}
          action={(
          <div className="w-full sm:w-auto">
            <CopyButton label="Copy supplier text" value={supplierText || "No supplier items yet."} />
          </div>
          )}
        >
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm font-semibold text-stone-800 wrap-anywhere">{supplierText || "No supplier items yet."}</pre>
        </AdminPanel>
      </div>

      <div className="mt-5">
      <AdminPanel
        title="Email Sending"
        description="Test Resend from this deployed site and see configuration issues."
        action={(
          <span className={emailConfig.hasApiKey && !emailConfig.senderError ? "badge-good" : "badge-warm"}>
            {emailConfig.hasApiKey && !emailConfig.senderError ? "Configured" : "Needs setup"}
          </span>
        )}
      >
        <div className="mt-4 grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm font-semibold text-stone-700 sm:grid-cols-2">
          <p>Resend key: {emailConfig.hasApiKey ? "Present" : "Missing"}</p>
          <p className="wrap-anywhere">From: {emailConfig.from}</p>
          {emailConfig.senderError && <p className="wrap-anywhere text-red-700 sm:col-span-2">{emailConfig.senderError}</p>}
        </div>
        <EmailTestForm defaultEmail={process.env.ADMIN_EMAIL ?? ""} />
        {emailFailures.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-black text-stone-950">Recent email errors</h3>
            {emailFailures.map((order: any) => (
              <div key={order.id} className="rounded-md border border-red-100 bg-red-50 p-3 text-sm">
                <p className="font-black text-stone-950">{order.order_number}</p>
                <p className="mt-1 font-semibold text-red-700 wrap-anywhere">{order.last_email_error}</p>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ReportTable icon={<LineChart className="h-5 w-5 text-leaf-700" />} title="Revenue by Batch" rows={byBatch} columns={["name", "orders", "revenue", "profit", "outstanding"]} />
        <ReportTable icon={<PackageSearch className="h-5 w-5 text-leaf-700" />} title="Supplier / Profit by Product" rows={supplier} columns={["batch", "name", "quantity", "revenue", "profit"]} />
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
        <table className="data-table min-w-[620px]">
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.batch ?? ""}-${row.name}`}>
                {columns.map((column) => (
                  <td key={column} className={column === "profit" ? "font-bold text-leaf-700" : ""}>
                    {["revenue", "profit", "outstanding"].includes(column) ? money(row[column]) : row[column]}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={columns.length} className="py-10 text-center font-semibold text-stone-500">No report data yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
