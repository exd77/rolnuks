"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  createProductAction,
  updateProductAction,
  type ActionState,
} from "@/server/actions/product";

const initialProductState: ActionState = {};

type Category = {
  id: string;
  name: string;
  type: string;
  slug: string;
};

type ProductData = {
  id: string;
  title: string;
  description: string | null;
  basePrice: { toString: () => string };
  stock: number;
  robuxAmount: number | null;
  includesPremium: boolean;
  deliveryMethod: string;
  status: string;
  featured: boolean;
  categoryId: string;
};

interface ProductFormProps {
  categories: Category[];
  product?: ProductData | null;
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const isEditing = !!product;

  const [state, action] = useActionState<ActionState, FormData>(
    isEditing ? updateProductAction : createProductAction,
    initialProductState,
  );

  const robuxCategories = categories.filter(
    (c) => c.type === "ROBUX_GAMEPASS" || c.type === "ROBUX_INSTANT",
  );

  return (
    <form action={action} className="space-y-6">
      {isEditing && <input type="hidden" name="id" value={product.id} />}

      {state.message && !state.ok && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Judul Produk *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={product?.title ?? ""}
          placeholder="contoh: 100 Robux Gamepass"
          required
        />
        <FieldError message={state.errors?.title} />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="categoryId">Kategori *</Label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={product?.categoryId ?? ""}
          required
          className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="">Pilih kategori...</option>
          {robuxCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <FieldError message={state.errors?.categoryId} />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={product?.description ?? ""}
          rows={4}
          placeholder="Deskripsi produk (opsional)"
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <FieldError message={state.errors?.description} />
      </div>

      {/* Price & Robux Amount */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="basePrice">Harga (Rp) *</Label>
          <Input
            id="basePrice"
            name="basePrice"
            type="text"
            inputMode="numeric"
            defaultValue={product?.basePrice.toString() ?? ""}
            placeholder="12000"
            required
          />
          <FieldError message={state.errors?.basePrice} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="robuxAmount">Jumlah Robux</Label>
          <Input
            id="robuxAmount"
            name="robuxAmount"
            type="text"
            inputMode="numeric"
            defaultValue={product?.robuxAmount?.toString() ?? ""}
            placeholder="100"
          />
          <FieldError message={state.errors?.robuxAmount} />
        </div>
      </div>

      {/* Stock & Delivery */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stock">Stock (-1 = unlimited)</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            defaultValue={product?.stock ?? -1}
          />
          <FieldError message={state.errors?.stock} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deliveryMethod">Metode Pengiriman *</Label>
          <select
            id="deliveryMethod"
            name="deliveryMethod"
            defaultValue={product?.deliveryMethod ?? "GAMEPASS"}
            required
            className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="GAMEPASS">Gamepass</option>
            <option value="GROUP_PAYOUT">Group Payout</option>
            <option value="TRADE">Trade</option>
            <option value="MANUAL_ITEM">Manual Item</option>
          </select>
          <FieldError message={state.errors?.deliveryMethod} />
        </div>
      </div>

      {/* Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <select
            id="status"
            name="status"
            defaultValue={product?.status ?? "DRAFT"}
            required
            className="border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Aktif</option>
            <option value="PAUSED">Dijeda</option>
          </select>
          <FieldError message={state.errors?.status} />
        </div>
        <div className="flex items-end gap-4 pb-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="includesPremium"
              defaultChecked={product?.includesPremium ?? false}
              className="border-input size-4 rounded"
            />
            Termasuk Premium
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
              className="border-input size-4 rounded"
            />
            Featured
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="border-border flex items-center gap-3 border-t pt-6">
        <SubmitButton pendingText="Menyimpan...">
          {isEditing ? "Simpan Perubahan" : "Tambah Produk"}
        </SubmitButton>
        <Button type="button" variant="outline" asChild>
          <a href="/admin/produk">Batal</a>
        </Button>
      </div>
    </form>
  );
}
