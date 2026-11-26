import { DatePipe, DecimalPipe } from '@angular/common';
import { SaleResponse, StockReceiptResponse } from '../models/admin.models';

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openPrintDocument(html: string): void {
  const printWin = window.open('', '_blank', 'width=720,height=840');
  if (!printWin) {
    window.alert('Pop-up blocked. Please allow pop-ups for this site to print or download receipts.');
    return;
  }
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
}

export function printSaleReceipt(
  sale: SaleResponse,
  datePipe: DatePipe,
  decimalPipe: DecimalPipe
): void {
  const formatCurrency = (val: number) =>
    `\u20B9${decimalPipe.transform(val, '1.2-2') ?? val.toFixed(2)}`;
  const formatDate = (val: string) => datePipe.transform(val, 'medium') ?? val;

  const itemRows = (sale.items ?? [])
    .map(
      (item) => `
      <tr>
        <td><strong>${escapeHtml(item.productName)}</strong><br/><small>${escapeHtml(item.productSku)}</small></td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${escapeHtml(formatCurrency(item.unitPrice))}</td>
        <td style="text-align:right">${escapeHtml(formatCurrency(item.lineTotal))}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt ${escapeHtml(sale.receiptNumber)}</title>
  <style>
    body { font-family: 'Courier New', monospace; margin: 24px; color: #000; }
    h2 { text-align: center; margin: 0 0 4px; font-size: 1.3rem; }
    .sub { text-align: center; color: #555; font-size: 0.85rem; margin-bottom: 10px; }
    .meta { font-size: 0.85rem; margin-bottom: 12px; border-bottom: 1px dashed #999; padding-bottom: 8px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin: 10px 0; }
    th { text-align: left; border-bottom: 1px solid #ccc; padding: 6px 4px; }
    td { padding: 6px 4px; border-bottom: 1px dashed #ddd; }
    .totals { border-top: 1px solid #000; padding-top: 8px; margin-top: 8px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.9rem; }
    .grand { font-size: 1.15rem; font-weight: bold; border-top: 1px solid #000; padding-top: 6px; margin-top: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 0.8rem; color: #666; border-top: 1px dashed #999; padding-top: 10px; }
  </style>
</head>
<body>
  <h2>RETAIL STORE IMS</h2>
  <div class="sub">Official Sales Receipt</div>
  <div class="meta">
    <div><strong>Receipt #:</strong> ${escapeHtml(sale.receiptNumber)}</div>
    <div><strong>Date:</strong> ${escapeHtml(formatDate(sale.saleDate))}</div>
    <div><strong>Cashier:</strong> ${escapeHtml(sale.cashierFullName)} (${escapeHtml(sale.cashierUsername)})</div>
  </div>
  <table>
    <thead><tr><th>Item / SKU</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Items Count:</span><strong>${sale.items?.length ?? 0}</strong></div>
    <div class="row grand"><span>Total Amount:</span><strong>${escapeHtml(formatCurrency(sale.totalAmount))}</strong></div>
  </div>
  <div class="footer"><p>Thank you for shopping with us!</p><small>Please retain this receipt for returns or exchanges.</small></div>
  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
    window.onafterprint = function() {
      window.close();
    };
  </script>
</body>
</html>`;

  openPrintDocument(html);
}

export function printStockReceipt(
  receipt: StockReceiptResponse,
  datePipe: DatePipe,
  decimalPipe: DecimalPipe
): void {
  const formatCurrency = (val: number) =>
    `\u20B9${decimalPipe.transform(val, '1.2-2') ?? val.toFixed(2)}`;
  const formatDate = (val: string) => datePipe.transform(val, 'medium') ?? val;

  const totalCost = (receipt.items ?? []).reduce(
    (sum, item) => sum + item.quantityReceived * item.unitCost,
    0
  );

  const itemRows = (receipt.items ?? [])
    .map(
      (item) => `
      <tr>
        <td><strong>${escapeHtml(item.productName)}</strong></td>
        <td>${escapeHtml(item.productSku)}</td>
        <td style="text-align:right">+${item.quantityReceived}</td>
        <td style="text-align:right">${escapeHtml(formatCurrency(item.unitCost))}</td>
        <td style="text-align:right"><strong>${escapeHtml(formatCurrency(item.quantityReceived * item.unitCost))}</strong></td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Stock Receipt ${escapeHtml(receipt.receiptReference)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; color: #000; font-size: 13px; }
    h1 { font-size: 1.4rem; margin: 0 0 4px; color: #1a237e; }
    .sub { color: #555; margin-bottom: 16px; font-size: 0.85rem; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #f8fafc; }
    .info-label { color: #64748b; font-size: 0.8rem; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.85rem; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; font-weight: 600; color: #475569; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #1a237e; font-size: 1rem; font-weight: bold; margin-top: 10px; }
    .footer { margin-top: 30px; color: #64748b; font-size: 0.8rem; border-top: 1px dashed #ccc; padding-top: 10px; text-align: center; }
  </style>
</head>
<body>
  <h1>STOCK RECEIPT</h1>
  <div class="sub">Retail Inventory Management System &mdash; ${escapeHtml(receipt.receiptReference)}</div>
  <div class="info-grid">
    <div><div class="info-label">Reference</div><strong>${escapeHtml(receipt.receiptReference)}</strong></div>
    <div><div class="info-label">Received Date</div><strong>${escapeHtml(formatDate(receipt.receivedDate))}</strong></div>
    <div><div class="info-label">Supplier</div><strong>${escapeHtml(receipt.supplierName)}</strong></div>
    <div><div class="info-label">Received By</div><strong>${escapeHtml(receipt.receivedByUsername)}</strong></div>
    <div><div class="info-label">Total Units</div><strong>${receipt.totalQuantityReceived}</strong></div>
    <div><div class="info-label">Notes</div>${escapeHtml(receipt.notes ?? '—')}</div>
  </div>
  <table>
    <thead>
      <tr><th>Product</th><th>SKU</th><th style="text-align:right">Qty Received</th><th style="text-align:right">Unit Cost</th><th style="text-align:right">Line Total</th></tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="total-row"><span>Total Cost:</span><span>${escapeHtml(formatCurrency(totalCost))}</span></div>
  <div class="footer">Generated on ${escapeHtml(new Date().toLocaleString())} &bull; Retail Store IMS</div>
  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
    window.onafterprint = function() {
      window.close();
    };
  </script>
</body>
</html>`;

  openPrintDocument(html);
}
