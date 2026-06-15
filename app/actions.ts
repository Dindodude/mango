"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { isLoginRateLimited, loginAttemptKey, logAdminAction, recordLoginAttempt } from "@/lib/audit";
import { clearDirectAdminSession, createDirectAdminSession, verifyDirectAdminCredentials } from "@/lib/admin-session";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { sendOrderReceivedEmail, sendPaymentVerifiedEmail } from "@/lib/email";
import { assertSameOrigin, parseUuid, requestIp } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { cleanText } from "@/lib/utils";

const checkoutSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email().max(180),
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

const paymentStatusSchema = z.enum(["Awaiting Payment", "Payment Claimed by Customer", "Payment Verified", "Payment Issue", "Refunded"]);
const orderStatusSchema = z.enum(["Submitted", "Confirmed", "Ready for Pickup", "Completed", "Cancelled"]);
const customerAuthSchema = z.object({
  email: z.string().email().max(180),
  password: z.string().min(6).max(100),
  fullName: z.string().max(120).optional(),
  phone: z.string().max(30).optional()
});

const customerProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(30)
});

export type ActionState = { ok: boolean; message: string; orderId?: string; orderNumber?: string };
export type AdminActionState = { ok: boolean; message: string };

function adminErrorMessage(message: string) {
  if (message.toLowerCase().includes("invalid path")) {
    return "Supabase URL should look like https://your-project.supabase.co. Remove anything after .co in Vercel, then redeploy.";
  }
  return message;
}

async function requestOrigin() {
  const headerStore = await headers();
  return headerStore.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
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

export async function signUpCustomer(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const parsed = customerAuthSchema.safeParse({
      email: cleanText(formData.get("email"), 180).toLowerCase(),
      password: String(formData.get("password") ?? ""),
      fullName: cleanText(formData.get("fullName"), 120),
      phone: cleanText(formData.get("phone"), 30)
    });
    if (!parsed.success) return { ok: false, message: "Please enter your email, password, name, and phone." };

    const supabase = await createServerSupabaseClient();
    const origin = await requestOrigin();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: origin ? `${origin}/auth/callback?next=/account` : undefined,
        data: {
          full_name: parsed.data.fullName ?? "",
          phone: parsed.data.phone ?? ""
        }
      }
    });
    if (error) return { ok: false, message: "Signup failed. Please check your email and password." };

    if (data.user) {
      await createAdminClient()
        .from("customer_profiles")
        .upsert({
          user_id: data.user.id,
          email: parsed.data.email,
          full_name: parsed.data.fullName ?? null,
          phone: parsed.data.phone ?? null,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
    }

    return { ok: true, message: "Account created. Please check your email to verify your account." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Signup failed. Please try again." };
  }
}

export async function loginCustomer(_: ActionState, formData: FormData): Promise<ActionState> {
  let shouldRedirect = false;
  try {
    await assertSameOrigin();
    const parsed = customerAuthSchema.pick({ email: true, password: true }).safeParse({
      email: cleanText(formData.get("email"), 180).toLowerCase(),
      password: String(formData.get("password") ?? "")
    });
    if (!parsed.success) return { ok: false, message: "Please enter your email and password." };

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { ok: false, message: "Login failed. Check your email and password." };
    shouldRedirect = true;
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Login failed. Please try again." };
  }
  if (shouldRedirect) redirect("/account");
  return { ok: false, message: "Login failed. Please try again." };
}

export async function logoutCustomer() {
  await assertSameOrigin();
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function saveCustomerProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin();
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.email) return { ok: false, message: "Please sign in again." };

    const parsed = customerProfileSchema.safeParse({
      fullName: cleanText(formData.get("fullName"), 120),
      phone: cleanText(formData.get("phone"), 30)
    });
    if (!parsed.success) return { ok: false, message: "Please enter your name and phone number." };

    const { error } = await createAdminClient()
      .from("customer_profiles")
      .upsert({
        user_id: user.id,
        email: user.email.toLowerCase(),
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    if (error) return { ok: false, message: error.message };
    revalidatePath("/account");
    return { ok: true, message: "Profile saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Profile could not be saved." };
  }
}

export async function submitPreorder(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin();
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Please refresh and try again." };
  }

  if (!hasSupabaseAdminConfig()) {
    return { ok: false, message: "Supabase is not configured yet. Please check your Vercel environment variables." };
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
    customerEmail: cleanText(formData.get("customerEmail"), 180).toLowerCase(),
    phone: cleanText(formData.get("phone"), 30),
    notes: cleanText(formData.get("notes"), 500),
    confirmedPaid: formData.get("confirmedPaid"),
    items
  });

  if (!parsed.success) return { ok: false, message: "Please complete all required fields." };

  let customerUserId: string | null = null;
  try {
    const customerClient = await createServerSupabaseClient();
    const { data } = await customerClient.auth.getUser();
    const user = data.user;
    if (user?.email_confirmed_at && user.email?.toLowerCase() === parsed.data.customerEmail) {
      customerUserId = user.id;
      await createAdminClient()
        .from("customer_profiles")
        .upsert({
          user_id: user.id,
          email: parsed.data.customerEmail,
          full_name: parsed.data.customerName,
          phone: parsed.data.phone,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" });
    }
  } catch {
    customerUserId = null;
  }

  const supabase = createAdminClient();
  const { data: activeBatch, error: batchError } = await supabase
    .from("batches")
    .select("id,batch_code")
    .eq("status", "Active")
    .maybeSingle();

  if (batchError) return { ok: false, message: batchError.message };
  if (!activeBatch) return { ok: false, message: "Preorders are currently closed. Please check back later." };

  const quantityByProduct = new Map<string, number>();
  parsed.data.items.forEach((item) => {
    quantityByProduct.set(item.product_id, (quantityByProduct.get(item.product_id) ?? 0) + item.quantity);
  });
  const productIds = [...quantityByProduct.keys()];

  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id,name,selling_price,cost_price")
    .in("id", productIds)
    .eq("active", true);

  if (productError) return { ok: false, message: productError.message };
  if (!products || products.length !== productIds.length) {
    return { ok: false, message: "One or more preorder items are unavailable." };
  }

  const lines = products.map((product) => {
    const quantity = quantityByProduct.get(product.id) ?? 0;
    const sellingPrice = Number(product.selling_price);
    const costPrice = Number(product.cost_price);
    return {
      product_id: product.id,
      product_name_snapshot: product.name,
      quantity,
      unit_selling_price_snapshot: sellingPrice,
      unit_cost_price_snapshot: costPrice,
      line_total: sellingPrice * quantity,
      line_cost: costPrice * quantity,
      line_profit: (sellingPrice - costPrice) * quantity
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
  const totalCost = lines.reduce((sum, line) => sum + line.line_cost, 0);
  const totalProfit = subtotal - totalCost;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: latestOrder, error: sequenceError } = await supabase
      .from("orders")
      .select("order_sequence")
      .eq("batch_id", activeBatch.id)
      .order("order_sequence", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sequenceError) return { ok: false, message: sequenceError.message };

    const nextSequence = Number(latestOrder?.order_sequence ?? 0) + 1;
    const newOrderNumber = `${activeBatch.batch_code}-${String(nextSequence).padStart(3, "0")}`;
    const successToken = crypto.randomBytes(24).toString("base64url");
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        batch_id: activeBatch.id,
        order_sequence: nextSequence,
        order_number: newOrderNumber,
        success_token: successToken,
        customer_user_id: customerUserId,
        customer_name: parsed.data.customerName,
        customer_email: parsed.data.customerEmail,
        phone: parsed.data.phone,
        notes: parsed.data.notes ?? null,
        subtotal_amount: subtotal,
        total_amount: subtotal,
        total_cost: totalCost,
        total_profit: totalProfit,
        payment_status: "Payment Claimed by Customer",
        order_status: "Submitted"
      })
      .select("id,order_number")
      .single();

    if (orderError?.code === "23505") continue;
    if (orderError || !order) return { ok: false, message: orderError?.message ?? "Order could not be created." };

    const { error: itemError } = await supabase
      .from("order_items")
      .insert(lines.map((line) => ({ ...line, order_id: order.id })));

    if (itemError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return { ok: false, message: itemError.message };
    }

    const emailResult = await sendOrderReceivedEmail({
      orderNumber: order.order_number,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      totalAmount: subtotal,
      items: lines
    });
    await supabase
      .from("orders")
      .update({
        order_received_email_sent_at: emailResult.sent ? new Date().toISOString() : null,
        last_email_error: emailResult.error
      })
      .eq("id", order.id);

    redirect(`/success?order=${encodeURIComponent(order.order_number)}&token=${encodeURIComponent(successToken)}`);
  }

  return { ok: false, message: "Please try submitting again. The order number was being used at the same time." };
}

export async function loginAdmin(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertSameOrigin();
  } catch {
    return { ok: false, message: "Login failed. Check your email and password." };
  }

  const email = cleanText(formData.get("email"), 160).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const attemptKey = loginAttemptKey(email, await requestIp());
  if (await isLoginRateLimited(attemptKey)) {
    return { ok: false, message: "Too many login attempts. Please try again later." };
  }
  const verified = verifyDirectAdminCredentials(email, password);
  await recordLoginAttempt(attemptKey, verified.ok);
  if (!verified.ok) return verified;

  await createDirectAdminSession(email);
  redirect("/admin");
}

export async function logoutAdmin() {
  await assertSameOrigin();
  await clearDirectAdminSession();
  redirect("/admin/login");
}

export async function saveProduct(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await assertSameOrigin();
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

    const rawId = String(formData.get("id") ?? "");
    const id = rawId ? parseUuid(rawId, "product ID") : "";
    const supabase = createAdminClient();
    const payload = { ...parsed.data, image_url: null };
    const { data, error } = id
      ? await supabase.from("products").update(payload).eq("id", id).select("id").single()
      : await supabase.from("products").insert(payload).select("id").single();
    if (error) return { ok: false, message: adminErrorMessage(error.message) };
    await logAdminAction({
      adminEmail: admin.email,
      action: id ? "product.update" : "product.create",
      entityType: "product",
      entityId: data?.id ?? id,
      metadata: { name: parsed.data.name, active: parsed.data.active }
    });

    revalidatePath("/admin/products");
    return { ok: true, message: "Product saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Product could not be saved." };
  }
}

export async function deleteProduct(formData: FormData) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  if (admin.role === "staff") throw new Error("Not allowed");
  const id = parseUuid(formData.get("id"), "product ID");
  await createAdminClient().from("products").delete().eq("id", id);
  await logAdminAction({ adminEmail: admin.email, action: "product.delete", entityType: "product", entityId: id });
  revalidatePath("/admin/products");
}

export async function saveBatch(_: AdminActionState, formData: FormData): Promise<AdminActionState> {
  try {
    await assertSameOrigin();
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

    const rawId = String(formData.get("id") ?? "");
    const id = rawId ? parseUuid(rawId, "batch ID") : "";
    const payload = {
      batch_code: batchCodeFromDate(arrivalDate),
      batch_name: parsed.data.batch_name?.trim() || batchNameFromDate(arrivalDate),
      start_date: String(formData.get("start_date") || todayIso()),
      cutoff_date: arrivalDate,
      expected_arrival_date: arrivalDate,
      status: parsed.data.status
    };
    const supabase = createAdminClient();
    const { data, error } = id
      ? await supabase.from("batches").update(payload).eq("id", id).select("id").single()
      : await supabase.from("batches").insert(payload).select("id").single();
    if (error?.code === "23505") return { ok: false, message: "A batch with this date already exists, or another batch is already Active." };
    if (error) return { ok: false, message: adminErrorMessage(error.message) };
    await logAdminAction({
      adminEmail: admin.email,
      action: id ? "batch.update" : "batch.create",
      entityType: "batch",
      entityId: data?.id ?? id,
      metadata: { status: parsed.data.status, arrival_date: arrivalDate }
    });

    revalidatePath("/admin/batches");
    revalidatePath("/");
    return { ok: true, message: "Batch saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Batch could not be saved." };
  }
}

export async function updateOrder(formData: FormData) {
  await assertSameOrigin();
  const admin = await requireAdmin();
  const orderId = parseUuid(formData.get("id"), "order ID");
  const paymentValues = formData.getAll("payment_status");
  const orderValues = formData.getAll("order_status");
  const paymentStatus = paymentStatusSchema.parse(cleanText(paymentValues[paymentValues.length - 1], 60));
  const orderStatus = orderStatusSchema.parse(cleanText(orderValues[orderValues.length - 1], 60));
  const supabase = createAdminClient();
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("*,order_items(product_name_snapshot,quantity,line_total)")
    .eq("id", orderId)
    .maybeSingle();

  if (orderStatus === "Cancelled") {
    await supabase.from("orders").delete().eq("id", orderId);
    await logAdminAction({ adminEmail: admin.email, action: "order.cancel_delete", entityType: "order", entityId: orderId });
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/admin/reports");
    redirect("/admin/orders");
  }

  const payload: Record<string, string> = { payment_status: paymentStatus, order_status: orderStatus };
  if (admin.role !== "staff") {
    payload.payment_reference_notes = cleanText(formData.get("payment_reference_notes"), 700);
    payload.admin_notes = cleanText(formData.get("admin_notes"), 1000);
  }
  const emailUpdate: Record<string, string | null> = {};
  if (
    paymentStatus === "Payment Verified" &&
    existingOrder?.customer_email &&
    !existingOrder.payment_verified_email_sent_at
  ) {
    const emailResult = await sendPaymentVerifiedEmail({
      orderNumber: existingOrder.order_number,
      customerName: existingOrder.customer_name,
      customerEmail: existingOrder.customer_email,
      totalAmount: Number(existingOrder.total_amount),
      items: existingOrder.order_items ?? []
    });
    emailUpdate.payment_verified_email_sent_at = emailResult.sent ? new Date().toISOString() : null;
    emailUpdate.last_email_error = emailResult.error;
  }

  await supabase.from("orders").update({ ...payload, ...emailUpdate }).eq("id", orderId);
  await logAdminAction({
    adminEmail: admin.email,
    action: "order.update",
    entityType: "order",
    entityId: orderId,
    metadata: { payment_status: paymentStatus, order_status: orderStatus }
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
