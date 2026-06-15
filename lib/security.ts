import { headers } from "next/headers";
import { z } from "zod";

const uuidSchema = z.string().uuid();

async function currentOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const fallbackProto = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const proto = headerStore.get("x-forwarded-proto") ?? fallbackProto;
  return host ? `${proto}://${host}` : "";
}

export async function assertSameOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const allowedOrigins = new Set(
    [process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, ""), (await currentOrigin()).replace(/\/+$/, "")]
      .filter(Boolean)
  );

  if (!origin || !allowedOrigins.has(origin.replace(/\/+$/, ""))) {
    throw new Error("Request could not be verified. Please refresh and try again.");
  }
}

export function parseUuid(value: FormDataEntryValue | string | null, label = "ID") {
  const parsed = uuidSchema.safeParse(String(value ?? ""));
  if (!parsed.success) throw new Error(`Invalid ${label}.`);
  return parsed.data;
}

export async function requestIp() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
}
