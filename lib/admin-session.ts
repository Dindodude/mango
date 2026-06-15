import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "mango_admin_session";
const SESSION_SECONDS = 60 * 60 * 12;

type AdminRole = "owner" | "admin" | "staff";

type AdminSession = {
  email: string;
  role: AdminRole;
  expiresAt: number;
};

function adminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD_HASH ?? "";
}

function adminRole(): AdminRole {
  const role = process.env.ADMIN_ROLE;
  return role === "admin" || role === "staff" ? role : "owner";
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function sign(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeSession(session: AdminSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value?: string): AdminSession | null {
  if (!value || !sessionSecret()) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!session.email || !session.role || Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

export function hasDirectAdminConfig() {
  return Boolean(adminEmail() && adminPassword() && sessionSecret());
}

function verifyPasswordHash(password: string, storedHash: string) {
  const [scheme, iterationsValue, salt, expectedHash] = storedHash.split("$");
  const iterations = Number(iterationsValue);
  if (scheme !== "pbkdf2_sha256" || !iterations || !salt || !expectedHash) return false;

  const actualHash = crypto
    .pbkdf2Sync(password, salt, iterations, 32, "sha256")
    .toString("base64url");

  return safeEqual(actualHash, expectedHash);
}

export function verifyDirectAdminCredentials(email: string, password: string) {
  if (!hasDirectAdminConfig()) {
    return {
      ok: false,
      message: "Admin login is not configured yet. Add ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and ADMIN_SESSION_SECRET in Vercel."
    };
  }

  if (!safeEqual(email.trim().toLowerCase(), adminEmail()) || !verifyPasswordHash(password, adminPassword())) {
    return { ok: false, message: "Login failed. Check your email and password." };
  }

  return { ok: true, message: "" };
}

export async function createDirectAdminSession(email: string) {
  const role = adminRole();
  const session: AdminSession = {
    email: email.trim().toLowerCase(),
    role,
    expiresAt: Date.now() + SESSION_SECONDS * 1000
  };

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession(session), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS
  });
}

export async function clearDirectAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getDirectAdminUser() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(COOKIE_NAME)?.value);
  if (!session) return null;

  return {
    id: "direct-admin",
    user_id: null,
    email: session.email,
    role: session.role,
    active: true
  };
}
