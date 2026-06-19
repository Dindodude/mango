import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

export function AdminSectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">{title}</h1>
      {description && <p className="mt-1 text-sm font-semibold text-stone-600">{description}</p>}
    </div>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <AdminSectionHeader eyebrow={eyebrow} title={title} description={description} />
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  if (status.includes("Verified") || status.includes("Completed") || status.includes("Confirmed") || status.includes("Ready")) {
    return <span className="badge-good"><CheckCircle2 className="h-3.5 w-3.5" />{status}</span>;
  }
  if (status.includes("Issue") || status.includes("Claimed") || status.includes("Awaiting")) {
    return <span className="badge-warm"><AlertTriangle className="h-3.5 w-3.5" />{status}</span>;
  }
  return <span className="badge"><Clock className="h-3.5 w-3.5" />{status}</span>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="surface p-10 text-center">
      <p className="text-lg font-black text-stone-950">{title}</p>
      <p className="mt-1 text-sm font-semibold text-stone-500">{body}</p>
    </div>
  );
}

export function MetricCard({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "good" | "warn" }) {
  const classes = tone === "warn" ? "border-amber-200 bg-amber-50/70" : tone === "good" ? "border-leaf-100 bg-leaf-50/70" : "";
  return (
    <div className={`surface p-4 ${classes}`}>
      <p className="text-xs font-black uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-stone-950">{value}</p>
    </div>
  );
}

export function WorkCard({
  title,
  value,
  body,
  href,
  tone = "default"
}: {
  title: string;
  value: React.ReactNode;
  body: string;
  href: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneClass = tone === "warn" ? "border-amber-200 bg-amber-50" : tone === "good" ? "border-leaf-100 bg-leaf-50" : "border-stone-200 bg-white";
  return (
    <Link href={href} className={`rounded-lg border p-4 shadow-crisp transition hover:-translate-y-0.5 hover:shadow-lg ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-stone-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-stone-950">{value}</p>
        </div>
        <ArrowUpRight className="h-5 w-5 text-stone-500" />
      </div>
      <p className="mt-3 text-sm font-semibold text-stone-600">{body}</p>
    </Link>
  );
}

export function AdminPanel({
  title,
  description,
  children,
  action
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-stone-100 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="font-black text-stone-950">{title}</h2>
          {description && <p className="mt-1 text-sm font-semibold text-stone-600">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
