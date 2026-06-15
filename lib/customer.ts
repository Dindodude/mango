import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

export async function getCustomerSession(): Promise<CustomerSession> {
  if (!hasSupabaseConfig()) return { user: null, profile: null };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return { user: null, profile: null };

  let profile = null;
  try {
    const { data: profileData } = await createAdminClient()
      .from("customer_profiles")
      .select("full_name,phone")
      .eq("user_id", user.id)
      .maybeSingle();
    profile = profileData;
  } catch {
    profile = null;
  }

  return {
    user: {
      id: user.id,
      email: user.email.toLowerCase(),
      emailConfirmed: Boolean(user.email_confirmed_at)
    },
    profile
  };
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
