"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  pendingText?: string;
}

/**
 * Drop-in submit button that reflects the parent <form>'s pending state via
 * `useFormStatus`. Pair with Server Actions / `useActionState`.
 */
export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...rest
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...rest}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? (pendingText ?? "Memproses…") : children}
    </Button>
  );
}
