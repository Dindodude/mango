import Link from "next/link";
import { CustomerAuthForm } from "@/components/customer-auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function AccountLoginPage() {
  return (
    <main className="public-page">
      <SiteHeader />
      <div className="public-ambient" />
      <div className="shell relative grid min-h-[70svh] gap-6 py-10 lg:grid-cols-[0.8fr_1fr] lg:items-center">
        <section className="reveal-up">
          <p className="eyebrow">My orders</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-stone-950 sm:text-5xl">Sign in to see your preorder history.</h1>
          <p className="mt-4 max-w-xl leading-7 text-stone-600">Use the same email from checkout. Guest checkout still works if you are in a rush.</p>
          <Link href="/preorder" className="btn-secondary mt-6 rounded-full">Continue as guest</Link>
        </section>
        <CustomerAuthForm mode="login" />
      </div>
      <SiteFooter />
    </main>
  );
}
