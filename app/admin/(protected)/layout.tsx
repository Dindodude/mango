import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <main className="min-h-screen bg-[#f7f5ee]">
      <AdminNav role={admin.role} />
      {children}
    </main>
  );
}
