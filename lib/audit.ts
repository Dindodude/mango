import crypto from "crypto";
import { hasSupabaseAdminConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const LOGIN_WINDOW_MINUTES = 15;
const LOGIN_MAX_FAILURES = 5;

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function loginAttemptKey(email: string, ip: string) {
  return sha256(`${email.trim().toLowerCase()}|${ip}`);
}

export async function isLoginRateLimited(keyHash: string) {
  if (!hasSupabaseAdminConfig()) return false;

  const since = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error } = await createAdminClient()
    .from("admin_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("key_hash", keyHash)
    .eq("success", false)
    .gte("created_at", since);

  if (error) return false;
  return Number(count ?? 0) >= LOGIN_MAX_FAILURES;
}

export async function recordLoginAttempt(keyHash: string, success: boolean) {
  if (!hasSupabaseAdminConfig()) return;

  try {
    await createAdminClient().from("admin_login_attempts").insert({ key_hash: keyHash, success });
  } catch {
    // Login audit failures should never expose internals or break the user flow.
  }
}

export async function logAdminAction(input: {
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  if (!hasSupabaseAdminConfig()) return;

  try {
    await createAdminClient().from("admin_audit_logs").insert({
      admin_email: input.adminEmail,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {}
    });
  } catch {
    // Audit logging is best-effort so admin operations do not fail because of logging.
  }
}
