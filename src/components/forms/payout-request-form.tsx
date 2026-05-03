"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestPayoutAction, type ActionState } from "@/server/actions/seller";

const initialState: ActionState = {};

export function PayoutRequestForm() {
  const [state, action] = useActionState<ActionState, FormData>(
    requestPayoutAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-3">
      {state.message && (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="amount">Jumlah payout</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="numeric"
          placeholder="100000"
          required
        />
        <FieldError message={state.errors?.amount} />
      </div>
      <SubmitButton pendingText="Mengirim…">Request Payout</SubmitButton>
    </form>
  );
}
