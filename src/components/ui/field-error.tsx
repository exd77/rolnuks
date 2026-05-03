import { cn } from "@/lib/utils";

/**
 * Tiny helper for displaying field-level validation messages from
 * Server Action state (`state.errors[field]`).
 */
export function FieldError({
  message,
  className,
}: {
  message?: string | string[];
  className?: string;
}) {
  if (!message || (Array.isArray(message) && message.length === 0)) return null;
  const text = Array.isArray(message) ? message[0] : message;
  return (
    <p className={cn("text-destructive mt-1 text-xs", className)}>{text}</p>
  );
}
