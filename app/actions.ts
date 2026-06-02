"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { clearDirectAdminSession, createDirectAdminSession, verifyDirectAdminCredentials } from "@/lib/admin-session";
import { hasSupabaseConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cleanText } from "@/lib/utils";

const checkoutSchema = z.object({
  customerName: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  notes: z.string().max(500).optional(),
  confirmedPaid: z.literal("on"),
  items: z
    .array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().positive().max(9999) }))
    .min(1)
});

const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(700).optional(),
  category: z.string().min(2).max(60),
  selling_price: z.coerce.number().min(0),
  cost_price: z.coerce.number().min(0),
  image_url: z.string().url().optional().or(z.literal("")),
  active: z.coerce.boolean().default(false),
  display_order: z.coerce.number().int().min(0).default(0)
});

const batchSchema = z.object({
  batch_code: z.string().min(3).max(30).regex(/^[A-Z0-9-]+$/),
  batch_name: z.string().min(3).max(120),
  start_date: z.string().min(8),
  cutoff_date: z.string().min(8),
  expected_arrival_date: z.string().min(8),
  status: z.enum(["Draft", "Active", "Closed", "Completed"])
});

export type ActionState = { ok: boolean; message: string; orderId?: string; orderNumber?: string };

export async function submitPreorder(_: ActionState, formData: FormData): Promise<ActionState> {
  if (!hasSupabaseConfig()) {
    return { ok: false, message: "Supabase is not configured yet. Please add .env.local first." };
  }

  const rawItems = String(formData.get("items") ?? "[]");
  let items: unknown;
  try {
    items = JSON.parse(rawItems);
  } catch {
    return { ok: false, message: "Please check your cart and try again." };
  }

  const parsed = checkoutSchema.safeParse({
    customerName: cleanText(formData.get("customerName"), 120),
    phone: cleanText(formData.get("phone"), 30),
    notes: cleanText(formData.get("notes"), 500),
    confirmedPaid: formData.get("confirmedPaid"),
    items
  });

  if (!parsed.success) return { ok: false, message: "Please complete all required fields." };

  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_public_preorder", {
    customer_name_input: parsed.data.customerName,
    phone_input: parsed.data.phone,
    notes_input: parsed.data.notes ?? "",
    items_input: parsed.data.items
  });

  if (error || !data?.[0]) {
    return { ok: false, message: error?.message || "Preorders are currently closed." };
  }

  redirect(`/success?order=${encodeURIComponent(data[0].order_number)}`);
}

export async function loginAdmin(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = cleanText(formData.get("email"), 160).toLowerCase();
  const password = String(formData.get("password") ?? "");

  const verified = verifyDirectAdminCredentials(email, password);
  if (!verified.ok) return verified;

  createDirectAdminSession(email);
  redirect("/admin");
}

export async function logoutAdmin() {
  clearDirectAdminSession();
  redirect("/admin/login");
}

export async function saveProduct(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role === "staff") throw new Error("Not allowed");
  const parsed = productSchema.parse({
    name: cleanText(formData.get("name"), 120),
    description: cleanText(formData.get("description"), 700),
    category: formData.get("category"),
    selling_price: formData.get("selling_price"),
    cost_price: formData.get("cost_price"),
    image_url: cleanText(formData.get("image_url"), 400),
    active: formData.get("active") === "on",
    display_order: formData.get("display_order") || 0
  });
  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();
  const payload = { ...parsed, image_url: parsed.image_url || null };
  if (id) await supabase.from("products").update(payload).eq("id", id);
  else await supabase.from("products").insert(payload);
  revalidatePath("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role === "staff") throw new Error("Not allowed");
  await createAdminClient().from("products").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/products");
}

export async function saveBatch(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role === "staff") throw new Error("Not allowed");
  const parsed = batchSchema.parse({
    batch_code: cleanText(formData.get("batch_code"), 30).toUpperCase(),
    batch_name: cleanText(formData.get("batch_name"), 120),
    start_date: formData.get("start_date"),
    cutoff_date: formData.get("cutoff_date"),
    expected_arrival_date: formData.get("expected_arrival_date"),
    status: formData.get("status")
  });
  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();
  const { error } = id
    ? await supabase.from("batches").update(parsed).eq("id", id)
    : await supabase.from("batches").insert(parsed);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/batches");
  revalidatePath("/");
}

export async function updateOrder(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("id"));
  const paymentValues = formData.getAll("payment_status");
  const orderValues = formData.getAll("order_status");
  const payload = {
    payment_status: cleanText(paymentValues[paymentValues.length - 1], 60),
    order_status: cleanText(orderValues[orderValues.length - 1], 60),
    payment_reference_notes: cleanText(formData.get("payment_reference_notes"), 700),
    admin_notes: cleanText(formData.get("admin_notes"), 1000)
  };
  await createAdminClient().from("orders").update(payload).eq("id", orderId);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
