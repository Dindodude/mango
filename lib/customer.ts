import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const CUSTOMER_COOKIE = "mango_customer_session";
const SESSION_DAYS = 30;
const CODE_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;

export type CustomerSession = {
  user: {
    id: string;
    email: string;
    emailConfirmed: boolean;
  } | null;
  profile: {
    full_name: string | null;
    phone: string | null;
  } | null;
};

function secret() {
  const value = process.env.CUSTOMER_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("Missing CUSTOMER_SESSION_SECRET. Add a random 32+ character value in Vercel.");
  }
  return value;
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateCustomerCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashCustomerCode(email: string, code: string) {
  return crypto
    .createHmac("sha256", secret())
    .update(`${normalizeEmail(email)}:${code.trim()}`)
    .digest("hex");
}

export function verifyCustomerCode(email: string, code: string, expectedHash: string) {
  return safeEqual(hashCustomerCode(email, code), expectedHash);
}

export function codeExpiresAt() {
  return new Date(Date.now() + CODE_MINUTES * 60 * 1000).toISOString();
}

export function maxCodeAttempts() {
  return MAX_CODE_ATTEMPTS;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, encodedHash: string | null | undefined) {
  if (!encodedHash || !encodedHash.includes(":")) return false;
  const [salt, storedHash] = encodedHash.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return safeEqual(hash, storedHash);
}

function sessionHash(token: string) {
  return sha256(`${secret()}:${token}`);
}

export async function createCustomerSession(customerId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const supabase = createAdminClient();
  const { error } = await supabase.from("customer_sessions").insert({
    customer_id: customerId,
    session_hash: sessionHash(token),
    expires_at: expiresAt.toISOString()
  });
  if (error) throw new Error(error.message);

  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function clearCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  if (token && hasSupabaseAdminConfig()) {
    try {
      await createAdminClient().from("customer_sessions").delete().eq("session_hash", sessionHash(token));
    } catch {
      // Clearing the browser cookie is still the important local logout step.
    }
  }
  cookieStore.set(CUSTOMER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export async function getCustomerSession(): Promise<CustomerSession> {
  if (!hasSupabaseAdminConfig()) return { user: null, profile: null };
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(CUSTOMER_COOKIE)?.value;
  } catch {
    token = undefined;
  }
  if (!token) return { user: null, profile: null };

  try {
    const supabase = createAdminClient();
    const { data: session } = await supabase
      .from("customer_sessions")
      .select("id,expires_at,customer_profiles(id,email,full_name,phone,email_verified_at)")
      .eq("session_hash", sessionHash(token))
      .maybeSingle();

    if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
      await clearCustomerSession();
      return { user: null, profile: null };
    }

    const profile = Array.isArray(session.customer_profiles)
      ? session.customer_profiles[0]
      : session.customer_profiles;
    if (!profile?.id || !profile.email) return { user: null, profile: null };

    return {
      user: {
        id: profile.id,
        email: normalizeEmail(profile.email),
        emailConfirmed: Boolean(profile.email_verified_at)
      },
      profile: {
        full_name: profile.full_name ?? null,
        phone: profile.phone ?? null
      }
    };
  } catch {
    return { user: null, profile: null };
  }
}

export async function requireCustomer() {
  const session = await getCustomerSession();
  if (!session.user) redirect("/account/login");
  return session;
}

export function customerOrderStatus(paymentStatus: string, orderStatus: string) {
  if (orderStatus === "Completed") return "Completed";
  if (orderStatus === "Ready for Pickup") return "Ready for pickup";
  if (paymentStatus === "Payment Verified") return "Confirmed";
  if (paymentStatus === "Payment Issue") return "Payment issue";
  return "Order received";
}

export function timelineState(paymentStatus: string, orderStatus: string) {
  return {
    received: true,
    payment: paymentStatus === "Payment Verified" || orderStatus === "Ready for Pickup" || orderStatus === "Completed",
    ready: orderStatus === "Ready for Pickup" || orderStatus === "Completed",
    completed: orderStatus === "Completed"
  };
}
