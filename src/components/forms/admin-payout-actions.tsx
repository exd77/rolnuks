"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { processPayoutAction, type ActionState } from "@/server/actions/payout";

const initialState: ActionState = {};

export function AdminPayoutActionForm({
  payoutId,
  status,
}: {
  payoutId: string;
  status: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    processPayoutAction,
    initialState,
  );
  const final = status === "COMPLETED" || status === "REJECTED";
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="payoutId" value={payoutId} />
      {state.message && (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <textarea
        name="notes"
        rows={2}
        maxLength={1000}
        placeholder="Catatan admin / referensi transfer"
        className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
        disabled={final}
      />
      <input
        name="proofImage"
        type="url"
        placeholder="URL bukti transfer (opsional saat complete)"
        className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
        disabled={final}
      />
      <input
        name="rejectedReason"
        placeholder="Alasan reject"
        className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
        disabled={final}
      />
      <FieldError message={state.errors?.rejectedReason} />
      <FieldError message={state.errors?.proofImage} />
      <div className="flex flex-wrap gap-2">
        {status === "REQUESTED" && (
          <Button
            type="submit"
            name="action"
            value="APPROVE"
            size="sm"
            disabled={pending}
          >
            Approve
          </Button>
        )}
        {(status === "REQUESTED" || status === "APPROVED") && (
          <Button
            type="submit"
            name="action"
            value="COMPLETE"
            size="sm"
            disabled={pending}
          >
            Mark Completed
          </Button>
        )}
        {!final && (
          <Button
            type="submit"
            name="action"
            value="REJECT"
            variant="destructive"
            size="sm"
            disabled={pending}
          >
            Reject & Refund Balance
          </Button>
        )}
      </div>
    </form>
  );
}
