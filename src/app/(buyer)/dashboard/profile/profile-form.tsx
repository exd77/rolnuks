"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  initialProfileState,
  updateProfileAction,
  type ProfileActionState,
} from "@/server/actions/profile";

interface ProfileFormProps {
  defaults: {
    name: string;
    robloxUsername: string;
    phone: string;
  };
}

export function ProfileForm({ defaults }: ProfileFormProps) {
  const [state, formAction] = useActionState<ProfileActionState, FormData>(
    updateProfileAction,
    initialProfileState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nama lengkap</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={defaults.name}
          required
          minLength={2}
          maxLength={80}
        />
        <FieldError message={state.errors?.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="robloxUsername">Username Roblox</Label>
        <Input
          id="robloxUsername"
          name="robloxUsername"
          type="text"
          placeholder="contoh: builderboy123"
          defaultValue={defaults.robloxUsername}
          autoComplete="off"
        />
        <p className="text-muted-foreground text-xs">
          Akan dipakai sebagai default saat checkout. Bisa diubah kapan saja.
        </p>
        <FieldError message={state.errors?.robloxUsername} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Nomor HP</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="08xxxxxxxxxx"
          defaultValue={defaults.phone}
          autoComplete="tel"
        />
        <p className="text-muted-foreground text-xs">
          Untuk notifikasi penting & verifikasi (opsional di MVP).
        </p>
        <FieldError message={state.errors?.phone} />
      </div>

      <SubmitButton pendingText="Menyimpan…">Simpan perubahan</SubmitButton>
    </form>
  );
}
