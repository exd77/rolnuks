"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldError } from "@/components/ui/field-error";
import {
  markAsDeliveredAction,
  type ActionState,
} from "@/server/actions/fulfillment";

const initialState: ActionState = {};

export function FulfillForm({ orderItemId }: { orderItemId: string }) {
  const [state, action, pending] = useActionState(
    markAsDeliveredAction,
    initialState,
  );

  if (state.ok) {
    return (
      <Alert variant="success">
        <CheckCircle2 className="size-4" />
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderItemId" value={orderItemId} />

      {state.message && !state.ok && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <label htmlFor={`notes-${orderItemId}`} className="text-xs font-medium">
          Catatan fulfillment (opsional)
        </label>
        <textarea
          id={`notes-${orderItemId}`}
          name="notes"
          rows={2}
          placeholder="Contoh: Gamepass sudah dibeli, Robux sudah masuk..."
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <FieldError message={state.errors?.notes} />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Memproses..." : "Mark as Delivered"}
      </Button>
    </form>
  );
}
