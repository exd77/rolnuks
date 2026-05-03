"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { applySellerAction, type ActionState } from "@/server/actions/seller";

const initialState: ActionState = {};

interface SellerApplyFormProps {
  defaults: {
    storeName: string;
    description: string;
    fullName: string;
    bankName: string;
    bankAccountNo: string;
    bankAccountName: string;
  };
}

export function SellerApplyForm({ defaults }: SellerApplyFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    applySellerAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="storeName">Nama Toko</Label>
          <Input
            id="storeName"
            name="storeName"
            type="text"
            defaultValue={defaults.storeName}
            placeholder="contoh: Toko Aldo"
            required
            minLength={3}
            maxLength={50}
          />
          <p className="text-muted-foreground text-xs">
            Nama unik untuk toko kamu di ORBLOX.
          </p>
          <FieldError message={state.errors?.storeName} />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="description">Deskripsi Toko</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaults.description}
            placeholder="Spesialis Blox Fruits — fast trade, terpercaya."
            maxLength={500}
            className="border-border bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
          <FieldError message={state.errors?.description} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">
          Verifikasi Identitas (KYC)
        </Label>
        <p className="text-muted-foreground text-xs">
          Kami butuh identitas untuk mencegah penipuan. Data ini hanya dilihat
          admin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nama lengkap (sesuai KTP)</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={defaults.fullName}
            required
            minLength={3}
            maxLength={100}
          />
          <FieldError message={state.errors?.fullName} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ktpNumber">Nomor KTP (16 digit)</Label>
          <Input
            id="ktpNumber"
            name="ktpNumber"
            type="text"
            inputMode="numeric"
            pattern="\d{16}"
            placeholder="3201xxxxxxxxxxxx"
            required
            maxLength={16}
            minLength={16}
          />
          <FieldError message={state.errors?.ktpNumber} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Nomor HP / WhatsApp</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="08xxxxxxxxxx"
            autoComplete="tel"
          />
          <FieldError message={state.errors?.phone} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Rekening Payout</Label>
        <p className="text-muted-foreground text-xs">
          Pencairan saldo akan dikirim ke rekening ini.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="bankName">Bank</Label>
          <Input
            id="bankName"
            name="bankName"
            type="text"
            defaultValue={defaults.bankName}
            placeholder="BCA / Mandiri / BRI"
            required
          />
          <FieldError message={state.errors?.bankName} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bankAccountNo">No. Rekening</Label>
          <Input
            id="bankAccountNo"
            name="bankAccountNo"
            type="text"
            inputMode="numeric"
            defaultValue={defaults.bankAccountNo}
            required
          />
          <FieldError message={state.errors?.bankAccountNo} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bankAccountName">Atas Nama</Label>
          <Input
            id="bankAccountName"
            name="bankAccountName"
            type="text"
            defaultValue={defaults.bankAccountName}
            required
          />
          <FieldError message={state.errors?.bankAccountName} />
        </div>
      </div>

      <SubmitButton pendingText="Mengirim aplikasi…">
        Kirim Aplikasi
      </SubmitButton>
    </form>
  );
}
