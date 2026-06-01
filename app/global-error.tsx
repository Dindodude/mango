"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "sans-serif" }}>
          <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
            <h1>Something needs attention.</h1>
            <p>Please check your app configuration and refresh.</p>
            <button onClick={reset}>Try again</button>
          </div>
        </main>
      </body>
    </html>
  );
}
