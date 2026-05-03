"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  deleteProductAction,
  type ActionState,
} from "@/server/actions/product";

const initialProductState: ActionState = {};

export function DeleteProductButton({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  const [, action, pending] = useActionState(
    deleteProductAction,
    initialProductState,
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Hapus produk "${productTitle}"? Aksi ini tidak bisa dibatalkan.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </form>
  );
}
