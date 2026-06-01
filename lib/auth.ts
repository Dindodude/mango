import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getAdminUser() {
  if (!hasSupabaseConfig()) return null;

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("id,user_id,email,role,active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  return data;
}

export async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return admin;
}

export function canManage(role: string, area: "orders" | "products" | "batches" | "reports") {
  if (role === "owner") return true;
  if (role === "admin") return true;
  return area === "orders" || area === "reports";
}
