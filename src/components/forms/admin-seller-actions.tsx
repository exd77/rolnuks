"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { verifySellerAction, type ActionState } from "@/server/actions/seller";

const initialState: ActionState = {};

export function AdminSellerDecisionForm({ sellerId }: { sellerId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    verifySellerAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="sellerId" value={sellerId} />
      {state.message && (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <textarea
        name="rejectedReason"
        rows={2}
        maxLength={500}
        placeholder="Alasan jika ditolak (opsional)"
        className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          name="action"
          value="APPROVE"
          size="sm"
          disabled={pending}
        >
          Approve
        </Button>
        <Button
          type="submit"
          name="action"
          value="REJECT"
          variant="destructive"
          size="sm"
          disabled={pending}
        >
          Reject
        </Button>
      </div>
    </form>
  );
}
