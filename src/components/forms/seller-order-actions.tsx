"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  sellerMarkDeliveredAction,
  type ActionState,
} from "@/server/actions/seller";

const initialState: ActionState = {};

export function SellerMarkDeliveredForm({
  orderItemId,
}: {
  orderItemId: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(
    sellerMarkDeliveredAction,
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
      <textarea
        name="notes"
        rows={2}
        maxLength={1000}
        placeholder="Catatan pengiriman / bukti trade (opsional)"
        className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
      />
      <SubmitButton size="sm" pendingText="Menyimpan…">
        Tandai terkirim
      </SubmitButton>
    </form>
  );
}

export function CompactSellerMarkDeliveredButton({
  orderItemId,
}: {
  orderItemId: string;
}) {
  const [, action, pending] = useActionState<ActionState, FormData>(
    sellerMarkDeliveredAction,
    initialState,
  );
  return (
    <form action={action}>
      <input type="hidden" name="orderItemId" value={orderItemId} />
      <Button type="submit" size="sm" disabled={pending}>
        Terkirim
      </Button>
    </form>
  );
}
