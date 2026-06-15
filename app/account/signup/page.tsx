import { CustomerAuthForm } from "@/components/customer-auth-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function AccountSignupPage() {
  return (
    <main>
      <SiteHeader />
      <div className="shell grid min-h-[70svh] gap-6 py-10 lg:grid-cols-[0.8fr_1fr] lg:items-center">
        <section>
          <p className="eyebrow">Faster next time</p>
          <h1 className="mt-2 text-4xl font-black leading-tight text-stone-950">Create an account for saved orders.</h1>
          <p className="mt-4 max-w-xl leading-7 text-stone-600">After email verification, orders using this email show in your account.</p>
        </section>
        <CustomerAuthForm mode="signup" />
      </div>
      <SiteFooter />
    </main>
  );
}
