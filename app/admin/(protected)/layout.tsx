import { AdminShell } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const supabase = createAdminClient();
  const { data: activeBatch } = await supabase
    .from("batches")
    .select("id,batch_name")
    .eq("status", "Active")
    .maybeSingle();
  let attentionQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("payment_status", ["Payment Claimed by Customer", "Payment Issue"])
    .neq("order_status", "Cancelled");
  if (activeBatch?.id) attentionQuery = attentionQuery.eq("batch_id", activeBatch.id);
  const { count: attentionCount } = await attentionQuery;

  return (
    <main className="min-h-screen bg-[#f7f5ee]">
      <AdminShell role={admin.role} activeBatchName={activeBatch?.batch_name} attentionCount={attentionCount ?? 0}>
      {children}
      </AdminShell>
    </main>
  );
}
