import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseUrl } from "@/lib/env";

export function createClient() {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  return createBrowserClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
