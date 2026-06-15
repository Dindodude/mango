"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="flex w-full min-w-0 items-center justify-between gap-3 rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm shadow-crisp transition hover:bg-leaf-50 sm:w-auto"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      <span className="font-semibold text-stone-600">{label}</span>
      <span className="flex min-w-0 max-w-[13rem] items-center gap-2 truncate font-black text-stone-950 sm:max-w-[18rem]">
        {copied ? "Copied" : value}
        <Copy className="h-4 w-4" />
      </span>
    </button>
  );
}
