import { CheckCircle2, Circle } from "lucide-react";

const labels = [
  ["received", "Order received"],
  ["payment", "Payment checked"],
  ["ready", "Ready for pickup"],
  ["completed", "Completed"]
] as const;

export function OrderTimeline({ state }: { state: Record<(typeof labels)[number][0], boolean> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {labels.map(([key, label]) => {
        const done = state[key];
        return (
          <div key={key} className={`rounded-md border p-3 text-sm font-bold ${done ? "border-leaf-100 bg-leaf-50 text-leaf-700" : "border-stone-200 bg-stone-50 text-stone-500"}`}>
            <div className="mb-2">{done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</div>
            {label}
          </div>
        );
      })}
    </div>
  );
}
