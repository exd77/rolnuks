import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getOrderForInvoice } from "@/server/services/admin-order";
import { escapeHtml, formatIDR } from "@/lib/utils";

/**
 * Invoice generation endpoint.
 * Returns an HTML invoice that can be printed as PDF from the browser.
 * Accessible by admin and the order's buyer.
 */
export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ orderId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await props.params;
  const order = await getOrderForInvoice(orderId);

  if (!order) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  // Only admin/staff or the buyer can view the invoice
  const isAdmin = ["ADMIN", "STAFF"].includes(session.user.role);
  const isBuyer = order.buyer.email === session.user.email;
  if (!isAdmin && !isBuyer) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const html = generateInvoiceHtml(order);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="invoice-${order.orderNumber.replace(/[^a-zA-Z0-9\-]/g, "_")}.html"`,
    },
  });
}

type InvoiceOrder = NonNullable<Awaited<ReturnType<typeof getOrderForInvoice>>>;

function generateInvoiceHtml(order: InvoiceOrder): string {
  const paidDate = order.paidAt
    ? new Date(order.paidAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const createdDate = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemRows = order.items
    .map(
      (item: InvoiceOrder["items"][number]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(item.productTitle)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatIDR(item.unitPrice.toString())}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatIDR(item.subtotal.toString())}</td>
    </tr>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${escapeHtml(order.orderNumber)} — ORBLOX</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 28px; font-weight: 800; color: #dc2626; }
    .brand-sub { font-size: 12px; color: #666; margin-top: 4px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 20px; color: #333; }
    .invoice-meta p { font-size: 13px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #999; margin-bottom: 8px; font-weight: 600; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item label { font-size: 12px; color: #999; display: block; }
    .info-item span { font-size: 14px; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { padding: 10px 12px; background: #f8f8f8; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; color: #666; border-bottom: 2px solid #eee; }
    th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
    th:nth-child(2) { text-align: center; }
    .total-row { border-top: 2px solid #333; }
    .total-row td { padding: 12px; font-weight: 700; font-size: 16px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
    .print-btn { position: fixed; top: 20px; right: 20px; padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
    .print-btn:hover { background: #b91c1c; }
    .status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .status-paid { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef9c3; color: #854d0e; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Cetak / Simpan PDF</button>

  <div class="header">
    <div>
      <div class="brand">ORBLOX</div>
      <div class="brand-sub">Marketplace Roblox Indonesia</div>
    </div>
    <div class="invoice-meta">
      <h2>INVOICE</h2>
      <p>${escapeHtml(order.orderNumber)}</p>
      <p>Tanggal: ${createdDate}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Informasi Pembeli</div>
    <div class="info-grid">
      <div class="info-item">
        <label>Nama</label>
        <span>${escapeHtml(order.buyer.name) || "-"}</span>
      </div>
      <div class="info-item">
        <label>Email</label>
        <span>${escapeHtml(order.buyer.email)}</span>
      </div>
      <div class="info-item">
        <label>Roblox Username</label>
        <span>${escapeHtml(order.buyer.robloxUsername) || "-"}</span>
      </div>
      <div class="info-item">
        <label>Tanggal Bayar</label>
        <span>${paidDate}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Detail Pesanan</div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Harga</th>
          <th style="text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="3" style="text-align:right;padding:12px;">Total</td>
          <td style="text-align:right;padding:12px;color:#dc2626;">${formatIDR(order.total.toString())}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  ${
    order.payment
      ? `
  <div class="section">
    <div class="section-title">Pembayaran</div>
    <div class="info-grid">
      <div class="info-item">
        <label>Metode</label>
        <span>${order.payment.paymentType ? escapeHtml(order.payment.paymentType.replace(/_/g, " ")) : "-"}</span>
      </div>
      <div class="info-item">
        <label>Transaction ID</label>
        <span>${escapeHtml(order.payment.transactionId) || "-"}</span>
      </div>
    </div>
  </div>
  `
      : ""
  }

  <div class="footer">
    <p>Invoice ini digenerate otomatis oleh sistem ORBLOX.</p>
    <p>Jika ada pertanyaan, hubungi support melalui menu Bantuan di dashboard.</p>
  </div>
</body>
</html>`;
}
