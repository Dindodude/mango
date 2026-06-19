"use client";

import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";

export function AdminFormButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn-primary sm:col-span-2" disabled={pending}>
      <Save className="h-4 w-4" />
      {pending ? "Saving..." : label}
    </button>
  );
}
