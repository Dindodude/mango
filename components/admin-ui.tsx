import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export function AdminSectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">{title}</h1>
      {description && <p className="mt-1 text-sm font-semibold text-stone-600">{description}</p>}
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
