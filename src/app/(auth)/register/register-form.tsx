"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  initialAuthState,
  registerAction,
  type ActionState,
} from "@/server/actions/auth";

export function RegisterForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    registerAction,
    initialAuthState,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && !state.errors && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nama lengkap</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Nama kamu"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
        />
        <FieldError message={state.errors?.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="kamu@example.com"
          autoComplete="email"
          required
        />
        <FieldError message={state.errors?.email} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-muted-foreground text-xs">Minimal 8 karakter.</p>
        <FieldError message={state.errors?.password} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Konfirmasi password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError message={state.errors?.confirmPassword} />
      </div>

      <SubmitButton size="lg" className="w-full" pendingText="Membuat akun…">
        Daftar gratis
      </SubmitButton>
    </form>
  );
}
