import Link from "next/link";
import { LockKeyhole, MessageCircle, Phone } from "lucide-react";
import { CONTACT_PHONE_DIGITS, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_E164, ETRANSFER_EMAIL, PICKUP_ADDRESS } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-950 text-white">
      <div className="shell grid gap-5 py-8 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-mango-300">Mango Preorders</p>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            Pickup: {PICKUP_ADDRESS}. E-transfer: {ETRANSFER_EMAIL}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={`sms:${CONTACT_PHONE_E164}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
          >
            <MessageCircle className="h-4 w-4" />
            Text {CONTACT_PHONE_DISPLAY}
          </a>
          <a
            href={`https://wa.me/${CONTACT_PHONE_DIGITS}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-mango-500 px-4 py-2.5 text-sm font-black text-stone-950 transition hover:bg-mango-300"
          >
            <Phone className="h-4 w-4" />
            WhatsApp
          </a>
          <Link
            href="/admin/login"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/15 px-4 py-2.5 text-sm font-bold text-stone-200 transition hover:bg-white/10 hover:text-white"
          >
            <LockKeyhole className="h-4 w-4" />
            Admin sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
