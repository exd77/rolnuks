"use client";

import { useActionState } from "react";
import { CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  markNotificationsReadAction,
  type ActionState,
} from "@/server/actions/fulfillment";

const initialState: ActionState = {};

export function MarkReadButton() {
  const [, action, pending] = useActionState(
    markNotificationsReadAction,
    initialState,
  );

  return (
    <form action={action}>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        <CheckCheck className="size-4" />
        {pending ? "..." : "Tandai semua dibaca"}
      </Button>
    </form>
  );
}
