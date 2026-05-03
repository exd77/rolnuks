"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  resolveDisputeAction,
  type ActionState,
} from "@/server/actions/dispute";

const initialState: ActionState = {};

export function AdminResolveDisputeForm({ disputeId }: { disputeId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    resolveDisputeAction,
    initialState,
  );
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="disputeId" value={disputeId} />
      {state.message && (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <textarea
        name="notes"
        rows={2}
        maxLength={2000}
        placeholder="Catatan resolusi untuk audit"
        className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="resolution"
          value="RESOLVED_SELLER"
          size="sm"
          disabled={pending}
        >
          Menangkan Seller / Release
        </Button>
        <Button
          type="submit"
          name="resolution"
          value="RESOLVED_BUYER"
          variant="destructive"
          size="sm"
          disabled={pending}
        >
          Menangkan Buyer / Refund
        </Button>
      </div>
    </form>
  );
}
