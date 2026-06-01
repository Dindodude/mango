import { CalendarPlus, Save } from "lucide-react";
import { saveBatch } from "@/app/actions";
import { batchStatuses } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function BatchesPage() {
  const { data: batches } = await createAdminClient().from("batches").select("*").order("created_at", { ascending: false });
  return (
    <div className="admin-shell">
      <div>
        <p className="eyebrow">Preorder windows</p>
        <h1 className="mt-2 text-3xl font-black text-stone-950 sm:text-4xl">Batches</h1>
        <p className="mt-1 text-sm font-semibold text-stone-600">Only one batch can be active at a time.</p>
      </div>

      <section className="surface mt-5 p-5">
        <div className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-leaf-700" />
          <h2 className="font-black text-stone-950">Create Batch</h2>
        </div>
        <BatchForm />
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {batches?.map((batch) => (
          <section key={batch.id} className="surface p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-black text-stone-950">{batch.batch_name}</h2>
                <p className="text-sm font-semibold text-stone-500">{batch.batch_code}</p>
              </div>
              <span className={batch.status === "Active" ? "badge-good" : "badge"}>{batch.status}</span>
            </div>
            <BatchForm batch={batch} />
          </section>
        ))}
      </div>
    </div>
  );
}

function BatchForm({ batch }: { batch?: any }) {
  return (
    <form action={saveBatch} className="mt-4 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="id" value={batch?.id ?? ""} />
      <input name="batch_code" defaultValue={batch?.batch_code} placeholder="JUN-W1-2026" required className="field" />
      <input name="batch_name" defaultValue={batch?.batch_name} placeholder="June Week 1" required className="field" />
      <input name="start_date" type="date" defaultValue={batch?.start_date} required className="field" />
      <input name="cutoff_date" type="date" defaultValue={batch?.cutoff_date} required className="field" />
      <input name="expected_arrival_date" type="date" defaultValue={batch?.expected_arrival_date} required className="field" />
      <select name="status" defaultValue={batch?.status ?? "Draft"} className="field">
        {batchStatuses.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <button className="btn-primary sm:col-span-2">
        <Save className="h-4 w-4" />
        Save batch
      </button>
    </form>
  );
}
