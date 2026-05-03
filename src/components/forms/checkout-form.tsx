"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { SnapPayment } from "@/components/checkout/snap-payment";

interface CheckoutFormProps {
  productSlug: string;
  deliveryMethod: string;
  gamepassRequiredAmount: number | null;
  robuxAmount: number | null;
}

type CheckoutState = {
  step: "form" | "payment";
  snapToken?: string;
  orderId?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export function CheckoutForm({
  productSlug,
  deliveryMethod,
  gamepassRequiredAmount,
  robuxAmount,
}: CheckoutFormProps) {
  const [state, setState] = useState<CheckoutState>({ step: "form" });
  const [pending, setPending] = useState(false);

  const isGamepass = deliveryMethod === "GAMEPASS";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setState((s) => ({ ...s, error: undefined, fieldErrors: undefined }));

    const formData = new FormData(e.currentTarget);
    const body = {
      productSlug,
      robloxUsername: formData.get("robloxUsername") as string,
      gamepassLink: (formData.get("gamepassLink") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({
          step: "form",
          error: data.message ?? "Gagal membuat pesanan.",
          fieldErrors: data.errors,
        });
        return;
      }

      // Move to payment step
      setState({
        step: "payment",
        snapToken: data.snapToken,
        orderId: data.orderId,
      });
    } catch {
      setState({
        step: "form",
        error: "Terjadi kesalahan jaringan. Coba lagi.",
      });
    } finally {
      setPending(false);
    }
  }

  if (state.step === "payment" && state.snapToken) {
    return <SnapPayment snapToken={state.snapToken} orderId={state.orderId!} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="border-border bg-card space-y-4 rounded-lg border p-5">
        <h2 className="font-semibold">Informasi Pengiriman</h2>

        <div className="space-y-2">
          <Label htmlFor="robloxUsername">Username Roblox *</Label>
          <Input
            id="robloxUsername"
            name="robloxUsername"
            placeholder="contoh: xXPlayerPro99Xx"
            required
          />
          <FieldError message={state.fieldErrors?.robloxUsername} />
          <p className="text-muted-foreground text-xs">
            Pastikan username sudah benar. Robux akan dikirim ke akun ini.
          </p>
        </div>

        {isGamepass && (
          <div className="space-y-2">
            <Label htmlFor="gamepassLink">Link Gamepass *</Label>
            <Input
              id="gamepassLink"
              name="gamepassLink"
              placeholder="https://www.roblox.com/game-pass/..."
              required
            />
            <FieldError message={state.fieldErrors?.gamepassLink} />
            {gamepassRequiredAmount && (
              <p className="text-muted-foreground text-xs">
                Buat gamepass dengan harga{" "}
                <strong>
                  {gamepassRequiredAmount.toLocaleString("id-ID")} R$
                </strong>
                . Setelah dipotong tax 30% Roblox, kamu akan menerima{" "}
                <strong>{robuxAmount?.toLocaleString("id-ID")} Robux</strong>.
              </p>
            )}
          </div>
        )}

        {deliveryMethod === "GROUP_PAYOUT" && (
          <Alert variant="info">
            <AlertDescription>
              Pastikan kamu sudah join group ORBLOX di Roblox minimal 14 hari
              agar Robux bisa dikirim via Group Payout.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Catatan (opsional)</Label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Info tambahan untuk admin..."
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>
      </div>

      <SubmitButton
        className="w-full"
        size="lg"
        disabled={pending}
        pendingText="Membuat pesanan..."
      >
        Bayar Sekarang
      </SubmitButton>
    </form>
  );
}
