"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  openDisputeAction,
  type ActionState as DisputeState,
} from "@/server/actions/dispute";
import {
  confirmDeliveryAction,
  type ActionState,
} from "@/server/actions/seller";

const initialState: ActionState = {};
const disputeInitialState: DisputeState = {};

export function ConfirmDeliveryButton({
  orderItemId,
}: {
  orderItemId: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    confirmDeliveryAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderItemId" value={orderItemId} />
      {state.message && (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        Konfirmasi diterima
      </Button>
    </form>
  );
}

export function OpenDisputeForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState<DisputeState, FormData>(
    openDisputeAction,
    disputeInitialState,
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      {state.message && (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <input
        name="reason"
        minLength={10}
        maxLength={200}
        placeholder="Alasan sengketa (min. 10 karakter)"
        className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
        required
      />
      <FieldError message={state.errors?.reason} />
      <textarea
        name="description"
        rows={3}
        maxLength={2000}
        placeholder="Detail masalah, kronologi, dan bukti yang tersedia"
        className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
      />
      <FieldError message={state.errors?.description} />
      <SubmitButton variant="outline" pendingText="Membuka sengketa…">
        Buka sengketa
      </SubmitButton>
    </form>
  );
}
