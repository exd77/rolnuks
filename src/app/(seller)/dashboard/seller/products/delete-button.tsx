"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteSellerProductAction,
  type ActionState,
} from "@/server/actions/seller";

const initialState: ActionState = {};

export function DeleteSellerProductButton({ id }: { id: string }) {
  const [, action, pending] = useActionState(
    deleteSellerProductAction,
    initialState,
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Hapus produk ini? Aksi ini tidak bisa dibatalkan.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Hapus</span>
      </Button>
    </form>
  );
}
