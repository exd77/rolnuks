"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch("/api/monitoring/error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-background text-foreground min-h-screen">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
          <p className="text-destructive text-sm font-semibold tracking-[0.3em] uppercase">
            ORBLOX Error
          </p>
          <h1 className="mt-3 text-3xl font-bold">Ada yang crash, tol.</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Error sudah dicatat ke monitoring internal. Coba refresh halaman
            beberapa saat lagi.
          </p>
          <button
            className="bg-primary text-primary-foreground mt-6 rounded-md px-4 py-2 text-sm font-semibold"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </main>
      </body>
    </html>
  );
}
