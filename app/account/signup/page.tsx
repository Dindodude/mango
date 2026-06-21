import { CustomerAuthForm } from "@/components/customer-auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function AccountSignupPage() {
  return (
    <main className="public-page">
      <SiteHeader />
      <div className="public-ambient" />
      <div className="shell relative grid min-h-[70svh] gap-6 py-10 lg:grid-cols-[0.8fr_1fr] lg:items-center">
        <section className="reveal-up">
          <p className="eyebrow">Faster next time</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-stone-950 sm:text-5xl">Create an account for saved orders.</h1>
          <p className="mt-4 max-w-xl leading-7 text-stone-600">After email verification, orders using this email show in your account.</p>
          <div className="mt-6 grid max-w-xl gap-2 text-sm font-bold text-stone-600 sm:grid-cols-3">
            <span className="rounded-full border border-stone-200 bg-white px-3 py-2">1. Email</span>
            <span className="rounded-full border border-stone-200 bg-white px-3 py-2">2. Code</span>
            <span className="rounded-full border border-stone-200 bg-white px-3 py-2">3. Profile</span>
          </div>
        </section>
        <CustomerAuthForm mode="signup" />
      </div>
      <SiteFooter />
    </main>
  );
}
