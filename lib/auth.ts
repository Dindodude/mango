import { redirect } from "next/navigation";
import { getDirectAdminUser } from "@/lib/admin-session";

export async function getAdminUser() {
  return getDirectAdminUser();
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
