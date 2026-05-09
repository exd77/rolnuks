import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely. Use everywhere we conditionally combine
 * class names with utility variants.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an IDR amount to Indonesian Rupiah string (Rp 12.000).
 * Avoids `Intl.NumberFormat` overhead in tight loops by caching formatter.
 */
const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatIDR(amount: number | string | bigint): string {
  const value = typeof amount === "string" ? Number(amount) : Number(amount);
  if (!Number.isFinite(value)) return "Rp 0";
  return idrFormatter.format(value);
}

/**
 * Compute the Robux gamepass nominal a buyer must create so that — after the
 * 30% Roblox marketplace fee — they net the requested amount of Robux.
 * Mirrors the formula documented in PLAN.md §5.1.
 */
export function calcGamepassRequiredAmount(robuxAmount: number): number {
  return Math.ceil(robuxAmount / 0.7);
}

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape a string for safe interpolation in HTML.
 * Prevents XSS when embedding user-supplied values in server-generated HTML
 * (e.g. invoice templates).
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch] ?? ch);
}
