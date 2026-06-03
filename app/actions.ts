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
  active: z.coerce.boolean().default(false)
});

const batchSchema = z.object({
  arrival_date: z.string().min(4).max(80),
  batch_name: z.string().max(120).optional(),
  status: z.enum(["Draft", "Active", "Closed", "Completed"])
});

export type ActionState = { ok: boolean; message: string; orderId?: string; orderNumber?: string };
export type AdminActionState = { ok: boolean; message: string };

function adminErrorMessage(message: string) {
  if (message.toLowerCase().includes("invalid path")) {
    return "Supabase URL should look like https://your-project.supabase.co. Remove anything after .co in Vercel, then redeploy.";
  }
  return message;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(year: number, monthIndex: number, day: number) {
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

function parseAdminDate(input: FormDataEntryValue | null) {
  const raw = cleanText(input, 80).replace(/,/g, " ").replace(/\s+/g, " ").trim();
  if (!raw) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const months: Record<string, number> = {
    january: 0,
    jan: 0,
    february: 1,
    feb: 1,
    march: 2,
    mar: 2,
    april: 3,
    apr: 3,
    may: 4,
    june: 5,
    jun: 5,
    july: 6,
    jul: 6,
    august: 7,
    aug: 7,
    september: 8,
    sep: 8,
    sept: 8,
    october: 9,
    oct: 9,
    november: 10,
    nov: 10,
    december: 11,
    dec: 11
  };

  const monthFirst = /^([a-z]+)\s+(\d{1,2})\s+(\d{4})$/i.exec(raw);
  if (monthFirst) {
    const month = months[monthFirst[1].toLowerCase()];
    if (month !== undefined) return toIsoDate(Number(monthFirst[3]), month, Number(monthFirst[2]));
  }

  const dayFirst = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i.exec(raw);
  if (dayFirst) {
    const month = months[dayFirst[2].toLowerCase()];
    if (month !== undefined) return toIsoDate(Number(dayFirst[3]), month, Number(dayFirst[1]));
  }

  return null;
}

function batchCodeFromDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase();
  return `${month}-${date.getUTCDate()}-${date.getUTCFullYear()}`;
}

function batchNameFromDate(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return `${date.toLocaleString("en-US", { month: "long", timeZone: "UTC" })} ${date.getUTCDate()} ${date.getUTCFullYear()} preorder`;
}

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

export async function saveProduct(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const admin = await requireAdmin();
    if (admin.role === "staff") return { ok: false, message: "Staff accounts cannot manage products." };
    const parsed = productSchema.safeParse({
      name: cleanText(formData.get("name"), 120),
      description: cleanText(formData.get("description"), 700),
      category: formData.get("category"),
      selling_price: formData.get("selling_price"),
      cost_price: formData.get("cost_price"),
      active: formData.get("active") === "on"
    });

    if (!parsed.success) return { ok: false, message: "Please check the product name and prices." };

    const id = String(formData.get("id") ?? "");
    const supabase = createAdminClient();
    const payload = { ...parsed.data, image_url: null };
    const { error } = id ? await supabase.from("products").update(payload).eq("id", id) : await supabase.from("products").insert(payload);
    if (error) return { ok: false, message: adminErrorMessage(error.message) };

    revalidatePath("/admin/products");
    return { ok: true, message: "Product saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Product could not be saved." };
  }
}

export async function deleteProduct(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role === "staff") throw new Error("Not allowed");
  await createAdminClient().from("products").delete().eq("id", String(formData.get("id")));
  revalidatePath("/admin/products");
}

export async function saveBatch(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    const admin = await requireAdmin();
    if (admin.role === "staff") return { ok: false, message: "Staff accounts cannot manage batches." };
    const parsed = batchSchema.safeParse({
      arrival_date: cleanText(formData.get("arrival_date"), 80),
      batch_name: cleanText(formData.get("batch_name"), 120),
      status: formData.get("status")
    });

    if (!parsed.success) return { ok: false, message: "Please enter an arrival date like June 15 2026." };

    const arrivalDate = parseAdminDate(formData.get("arrival_date"));
    if (!arrivalDate) return { ok: false, message: "Please enter the date like June 15 2026." };

    const id = String(formData.get("id") ?? "");
    const payload = {
      batch_code: batchCodeFromDate(arrivalDate),
      batch_name: parsed.data.batch_name?.trim() || batchNameFromDate(arrivalDate),
      start_date: String(formData.get("start_date") || todayIso()),
      cutoff_date: arrivalDate,
      expected_arrival_date: arrivalDate,
      status: parsed.data.status
    };
    const supabase = createAdminClient();
    const { error } = id ? await supabase.from("batches").update(payload).eq("id", id) : await supabase.from("batches").insert(payload);
    if (error?.code === "23505") return { ok: false, message: "A batch with this date already exists, or another batch is already Active." };
    if (error) return { ok: false, message: adminErrorMessage(error.message) };

    revalidatePath("/admin/batches");
    revalidatePath("/");
    return { ok: true, message: "Batch saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Batch could not be saved." };
  }
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
