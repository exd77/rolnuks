"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SnapPaymentProps {
  snapToken: string;
  orderId: string;
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: Record<string, unknown>) => void;
          onPending?: (result: Record<string, unknown>) => void;
          onError?: (result: Record<string, unknown>) => void;
          onClose?: () => void;
        },
      ) => void;
      embed: (
        token: string,
        options: {
          embedId: string;
          onSuccess?: (result: Record<string, unknown>) => void;
          onPending?: (result: Record<string, unknown>) => void;
          onError?: (result: Record<string, unknown>) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

export function SnapPayment({ snapToken, orderId }: SnapPaymentProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
    const isProduction =
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    const scriptUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => {
      setStatus("ready");
      openSnap();
    };
    script.onerror = () => setStatus("error");
    document.head.appendChild(script);

    return () => {
      // Cleanup: don't remove script as Snap may need it
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openSnap() {
    if (!window.snap) {
      setStatus("error");
      return;
    }

    window.snap.pay(snapToken, {
      onSuccess: () => {
        router.push(`/dashboard/orders/${orderId}`);
      },
      onPending: () => {
        router.push(`/dashboard/orders/${orderId}`);
      },
      onError: () => {
        setStatus("error");
      },
      onClose: () => {
        // User closed the payment popup
        router.push(`/dashboard/orders/${orderId}`);
      },
    });
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            Gagal membuka halaman pembayaran. Silakan coba lagi.
          </AlertDescription>
        </Alert>
        <Button onClick={openSnap} className="w-full">
          Coba Lagi
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/dashboard/orders/${orderId}`)}
        >
          Lihat Status Pesanan
        </Button>
      </div>
    );
  }

  return (
    <div className="border-border bg-card flex flex-col items-center justify-center gap-4 rounded-lg border p-12">
      <Loader2 className="text-primary size-8 animate-spin" />
      <p className="text-muted-foreground text-sm">
        Mempersiapkan pembayaran...
      </p>
    </div>
  );
}
