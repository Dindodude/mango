const supabaseApiPaths = ["/rest/v1", "/auth/v1", "/storage/v1", "/realtime/v1"];

export function normalizeSupabaseUrl(value?: string) {
  const raw = value?.trim().replace(/\/+$/, "") ?? "";
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const matchedPath = supabaseApiPaths.find((path) => url.pathname.startsWith(path));
    if (matchedPath) {
      url.pathname = "";
      url.search = "";
      url.hash = "";
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    return raw;
  }
}

export function getSupabaseUrl() {
  return normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasSupabaseAdminConfig() {
  return hasSupabaseConfig() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
