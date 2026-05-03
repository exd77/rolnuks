"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  createSellerProductAction,
  updateSellerProductAction,
  type ActionState,
} from "@/server/actions/seller";

const initialState: ActionState = {};

interface Category {
  id: string;
  name: string;
}

interface Game {
  id: string;
  name: string;
}

interface SellerProductFormProps {
  mode: "create" | "edit";
  categories: Category[];
  games: Game[];
  defaults?: {
    id?: string;
    title?: string;
    categoryId?: string | null;
    gameId?: string | null;
    description?: string | null;
    basePrice?: string | number;
    stock?: number;
    deliveryMethod?: string;
    status?: string;
  };
}

export function SellerProductForm({
  mode,
  categories,
  games,
  defaults = {},
}: SellerProductFormProps) {
  const action =
    mode === "create" ? createSellerProductAction : updateSellerProductAction;

  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && (
        <Alert variant={state.ok ? "success" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {mode === "edit" && defaults.id && (
        <input type="hidden" name="id" value={defaults.id} />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">Judul Produk</Label>
        <Input
          id="title"
          name="title"
          type="text"
          defaultValue={defaults.title ?? ""}
          required
          minLength={3}
          maxLength={200}
          placeholder="contoh: Dragon Fruit Permanent — Blox Fruits"
        />
        <FieldError message={state.errors?.title} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gameId">Game</Label>
          <select
            id="gameId"
            name="gameId"
            defaultValue={defaults.gameId ?? ""}
            required
            className="border-border bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="">Pilih game…</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.gameId} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Kategori</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={defaults.categoryId ?? ""}
            required
            className="border-border bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="">Pilih kategori…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError message={state.errors?.categoryId} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={defaults.description ?? ""}
          maxLength={5000}
          placeholder="Detail item, rarity, level, dll."
          className="border-border bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <FieldError message={state.errors?.description} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="basePrice">Harga (Rp)</Label>
          <Input
            id="basePrice"
            name="basePrice"
            type="text"
            inputMode="numeric"
            defaultValue={defaults.basePrice?.toString() ?? ""}
            placeholder="50000"
            required
          />
          <FieldError message={state.errors?.basePrice} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stock">Stok</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={1}
            defaultValue={defaults.stock?.toString() ?? "1"}
            required
          />
          <FieldError message={state.errors?.stock} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deliveryMethod">Metode Kirim</Label>
          <select
            id="deliveryMethod"
            name="deliveryMethod"
            defaultValue={defaults.deliveryMethod ?? "TRADE"}
            required
            className="border-border bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="TRADE">Trade Roblox</option>
            <option value="MANUAL_ITEM">Manual Item</option>
          </select>
          <FieldError message={state.errors?.deliveryMethod} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaults.status ?? "DRAFT"}
          className="border-border bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none md:w-60"
        >
          <option value="DRAFT">Draft (tidak tampil)</option>
          <option value="ACTIVE">Aktif (tampil di katalog)</option>
          <option value="PAUSED">Dijeda</option>
        </select>
        <FieldError message={state.errors?.status} />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <SubmitButton pendingText="Menyimpan…">
          {mode === "create" ? "Buat Produk" : "Simpan Perubahan"}
        </SubmitButton>
        <Button asChild type="button" variant="outline">
          <Link href="/dashboard/seller/products">Batal</Link>
        </Button>
      </div>
    </form>
  );
}
