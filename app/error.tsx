"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-stone-950 px-4">
      <div className="surface max-w-md p-6 text-center">
        <h1 className="text-2xl font-black text-stone-950">Something needs attention.</h1>
        <p className="mt-3 text-sm leading-6 text-stone-700">
          Please check your Supabase environment variables and restart the dev server.
        </p>
        <button onClick={reset} className="btn-primary mt-5">
          Try again
        </button>
      </div>
    </main>
  );
}
