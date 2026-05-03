import "server-only";

import crypto from "crypto";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const midtransClient = require("midtrans-client");

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

/**
 * Midtrans Snap instance for creating payment transactions.
 */
export const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
});

/**
 * Midtrans Core API instance for checking transaction status and notifications.
 */
export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
});

/**
 * Verify Midtrans webhook notification signature.
 * The signature key = SHA512(order_id + status_code + gross_amount + serverKey)
 */
export function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
): string {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const input = orderId + statusCode + grossAmount + serverKey;
  return crypto.createHash("sha512").update(input).digest("hex");
}

export type MidtransNotification = {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: string;
  currency: string;
  va_numbers?: Array<{ va_number: string; bank: string }>;
};
