import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PosService } from '../../../core/services/pos.service';
import { SaleResponse, SaleItemResponse } from '../../../core/models/admin.models';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <h1>My Sales History</h1>
        <p>Review completed sales transactions processed by your account.</p>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-3"></mat-progress-bar>
      }

      <mat-card class="content-card">
        <!-- Filter Bar -->
        <div class="filter-bar">
          <mat-form-field appearance="outline" density="compact">
            <mat-label>Start Date</mat-label>
            <input matInput type="date" [(ngModel)]="startDate" />
          </mat-form-field>

          <mat-form-field appearance="outline" density="compact">
            <mat-label>End Date</mat-label>
            <input matInput type="date" [(ngModel)]="endDate" />
          </mat-form-field>

          <button mat-flat-button color="primary" (click)="loadSales(0)">
            <mat-icon>filter_list</mat-icon> Filter
          </button>
          <button mat-stroked-button (click)="resetFilters()" [disabled]="!startDate && !endDate">
            <mat-icon>clear</mat-icon> Reset
          </button>
        </div>

        <!-- Sales Table -->
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Sale Date &amp; Time</th>
                <th>Items Sold</th>
                <th style="text-align: right;">Total Amount</th>
                <th style="text-align: center; width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (sales().length === 0 && !loading()) {
                <tr>
                  <td colspan="5" class="text-center py-4">No sales records found.</td>
                </tr>
              }
              @for (sale of sales(); track sale.id) {
                <tr>
                  <td><code>{{ sale.receiptNumber }}</code></td>
                  <td>{{ sale.saleDate | date:'medium' }}</td>
                  <td>{{ sale.items?.length || 0 }} product(s)</td>
                  <td style="text-align: right;"><strong>&#8377;{{ sale.totalAmount | number:'1.2-2' }}</strong></td>
                  <td style="text-align: center;">
                    <button mat-icon-button color="primary" (click)="viewReceipt(sale)" title="View Receipt">
                      <mat-icon>receipt</mat-icon>
                    </button>
                    <button mat-icon-button color="accent" (click)="downloadPdf(sale)" title="Download PDF">
                      <mat-icon>download</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar">
          <span>Page {{ currentPage() + 1 }} of {{ totalPages() > 0 ? totalPages() : 1 }} (Total: {{ totalElements() }} sales)</span>
          <div class="page-buttons">
            <button mat-stroked-button [disabled]="currentPage() === 0 || loading()" (click)="loadSales(currentPage() - 1)">
              Previous
            </button>
            <button mat-stroked-button [disabled]="currentPage() >= totalPages() - 1 || loading()" (click)="loadSales(currentPage() + 1)">
              Next
            </button>
          </div>
        </div>
      </mat-card>
    </div>

    <!-- RECEIPT MODAL -->
    @if (selectedSale()) {
      <div class="receipt-backdrop" (click)="closeReceipt()">
        <mat-card class="receipt-dialog-card" (click)="$event.stopPropagation()">
          <div class="dialog-actions-top">
            <button mat-icon-button (click)="closeReceipt()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Printable Area -->
          <div id="receipt-print-area" class="receipt-paper">
            <div class="store-header">
              <h2>RETAIL STORE IMS</h2>
              <p>Official Sales Receipt</p>
              <div class="receipt-meta">
                <div><strong>Receipt #:</strong> {{ selectedSale()?.receiptNumber }}</div>
                <div><strong>Date:</strong> {{ selectedSale()?.saleDate | date:'medium' }}</div>
                <div><strong>Cashier:</strong> {{ selectedSale()?.cashierFullName }} ({{ selectedSale()?.cashierUsername }})</div>
              </div>
            </div>

            <table class="receipt-table">
              <thead>
                <tr>
                  <th>Item / SKU</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (item of selectedSale()?.items; track item.id) {
                  <tr>
                    <td>
                      <div><strong>{{ item.productName }}</strong></div>
                      <small><code>{{ item.productSku }}</code></small>
                    </td>
                    <td style="text-align: center;">{{ item.quantity }}</td>
                    <td style="text-align: right;">&#8377;{{ item.unitPrice | number:'1.2-2' }}</td>
                    <td style="text-align: right;">&#8377;{{ item.lineTotal | number:'1.2-2' }}</td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="receipt-totals">
              <div class="receipt-total-row">
                <span>Items Count:</span>
                <strong>{{ selectedSale()?.items?.length ?? 0 }}</strong>
              </div>
              <div class="receipt-total-row grand">
                <span>Total Amount:</span>
                <strong>&#8377;{{ selectedSale()?.totalAmount | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div class="receipt-footer">
              <p>Thank you for shopping with us!</p>
              <small>Please retain this receipt for returns or exchanges.</small>
            </div>
          </div>

          <div class="modal-buttons">
            <button mat-flat-button color="primary" (click)="downloadPdf(selectedSale()!)">
              <mat-icon>download</mat-icon> Download PDF
            </button>
            <button mat-stroked-button color="primary" (click)="printSelectedReceipt()">
              <mat-icon>print</mat-icon> Print
            </button>
            <button mat-stroked-button (click)="closeReceipt()">Close</button>
          </div>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .page-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .header-section {
      margin-bottom: 1.5rem;
    }
    .header-section h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a237e;
    }
    .header-section p {
      color: #64748b;
      margin: 0;
    }
    .mb-3 { margin-bottom: 1rem; }
    .content-card {
      border-radius: 12px;
      padding: 1.5rem;
    }
    .filter-bar {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .table-wrap {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }
    .page-buttons {
      display: flex;
      gap: 0.5rem;
    }
    .text-center { text-align: center; }
    .py-4 { padding: 1.5rem 0; }
    .receipt-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    .receipt-dialog-card {
      max-width: 460px;
      width: 100%;
      border-radius: 12px;
      padding: 1.5rem;
      background: white;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }
    .dialog-actions-top {
      display: flex;
      justify-content: flex-end;
    }
    .receipt-paper {
      font-family: 'Courier New', Courier, monospace;
      padding: 1rem;
      background: #fff;
    }
    .store-header {
      text-align: center;
      margin-bottom: 1rem;
      border-bottom: 1px dashed #94a3b8;
      padding-bottom: 0.75rem;
    }
    .store-header h2 { margin: 0; font-size: 1.3rem; }
    .store-header p { margin: 2px 0 8px; color: #64748b; font-size: 0.85rem; }
    .receipt-meta {
      font-size: 0.8rem;
      text-align: left;
      line-height: 1.4;
    }
    .receipt-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      margin: 1rem 0;
    }
    .receipt-table th {
      text-align: left;
      border-bottom: 1px solid #cbd5e1;
      padding: 4px;
    }
    .receipt-table td {
      padding: 6px 4px;
      border-bottom: 1px dashed #e2e8f0;
    }
    .receipt-totals {
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 8px;
    }
    .receipt-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      margin-bottom: 4px;
    }
    .receipt-total-row.grand {
      font-size: 1.2rem;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #000;
    }
    .receipt-footer {
      text-align: center;
      margin-top: 1.5rem;
      border-top: 1px dashed #94a3b8;
      padding-top: 0.75rem;
      font-size: 0.8rem;
      color: #64748b;
    }
    .modal-buttons {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
      flex-wrap: wrap;
    }
  `],
})
export class SalesHistoryComponent implements OnInit {
  private readonly posService = inject(PosService);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);

  readonly loading = signal(false);
  readonly sales = signal<SaleResponse[]>([]);
  readonly currentPage = signal(0);
  readonly totalPages = signal(1);
  readonly totalElements = signal(0);
  readonly selectedSale = signal<SaleResponse | null>(null);

  startDate = '';
  endDate = '';

  ngOnInit(): void {
    this.loadSales(0);
  }

  loadSales(page: number): void {
    this.loading.set(true);
    this.currentPage.set(page);

    const startIso = this.startDate ? new Date(this.startDate + 'T00:00:00').toISOString() : undefined;
    const endIso = this.endDate ? new Date(this.endDate + 'T23:59:59').toISOString() : undefined;

    this.posService
      .getMySales(startIso, endIso, page, 15)
      .subscribe({
        next: (res) => {
          this.sales.set(res.content ?? []);
          this.totalPages.set(res.totalPages ?? 1);
          this.totalElements.set(res.totalElements ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  resetFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadSales(0);
  }

  viewReceipt(sale: SaleResponse): void {
    this.selectedSale.set(sale);
  }

  closeReceipt(): void {
    this.selectedSale.set(null);
  }

  printSelectedReceipt(): void {
    const sale = this.selectedSale();
    if (!sale) return;
    this.openPrintWindow(sale);
  }

  downloadPdf(sale: SaleResponse): void {
    this.openPrintWindow(sale);
  }

  private openPrintWindow(sale: SaleResponse): void {
    const formatCurrency = (val: number) => `\u20B9${this.decimalPipe.transform(val, '1.2-2') ?? val.toFixed(2)}`;
    const formatDate = (val: string) => this.datePipe.transform(val, 'medium') ?? val;

    const itemRows = (sale.items ?? []).map(item => `
      <tr>
        <td><strong>${item.productName}</strong><br/><small>${item.productSku}</small></td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatCurrency(item.unitPrice)}</td>
        <td style="text-align:right">${formatCurrency(item.lineTotal)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt ${sale.receiptNumber}</title>
  <style>
    body { font-family: 'Courier New', monospace; margin: 20px; color: #000; }
    h2 { text-align: center; margin: 0 0 4px; font-size: 1.3rem; }
    .sub { text-align: center; color: #555; font-size: 0.85rem; margin-bottom: 8px; }
    .meta { font-size: 0.8rem; margin-bottom: 12px; border-bottom: 1px dashed #999; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin: 10px 0; }
    th { text-align: left; border-bottom: 1px solid #ccc; padding: 4px; }
    td { padding: 6px 4px; border-bottom: 1px dashed #ddd; }
    .totals { border-top: 1px solid #000; padding-top: 8px; margin-top: 8px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.9rem; }
    .grand { font-size: 1.1rem; font-weight: bold; border-top: 1px solid #000; padding-top: 6px; margin-top: 4px; }
    .footer { text-align: center; margin-top: 20px; font-size: 0.8rem; color: #666; border-top: 1px dashed #999; padding-top: 10px; }
  </style>
</head>
<body>
  <h2>RETAIL STORE IMS</h2>
  <div class="sub">Official Sales Receipt</div>
  <div class="meta">
    <div><strong>Receipt #:</strong> ${sale.receiptNumber}</div>
    <div><strong>Date:</strong> ${formatDate(sale.saleDate)}</div>
    <div><strong>Cashier:</strong> ${sale.cashierFullName} (${sale.cashierUsername})</div>
  </div>
  <table>
    <thead><tr><th>Item / SKU</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Items Count:</span><strong>${sale.items?.length ?? 0}</strong></div>
    <div class="row grand"><span>Total Amount:</span><strong>${formatCurrency(sale.totalAmount)}</strong></div>
  </div>
  <div class="footer"><p>Thank you for shopping with us!</p><small>Please retain this receipt for returns or exchanges.</small></div>
  <script>window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };</script>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=500,height=700');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    }
  }
}
