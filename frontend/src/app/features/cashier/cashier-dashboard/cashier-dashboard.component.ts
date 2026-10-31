import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../../core/services/auth.service';
import { PosService } from '../../../core/services/pos.service';
import { SaleResponse } from '../../../core/models/admin.models';

@Component({
  selector: 'app-cashier-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="dashboard-header no-print">
      <div>
        <h1>Cashier Dashboard</h1>
        <p>Welcome, <strong>{{ currentUser()?.fullName }}</strong>. Store checkout register and shift summary.</p>
      </div>
      <div class="header-actions">
        <button mat-raised-button color="accent" routerLink="/cashier/pos" class="pos-action-btn">
          <mat-icon>point_of_sale</mat-icon> Open Register / POS
        </button>
      </div>
    </div>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" class="mb-4"></mat-progress-bar>
    }

    <!-- Shift KPI Summary -->
    <div class="kpi-grid no-print">
      <mat-card class="kpi-card">
        <mat-card-content>
          <div class="kpi-icon-wrap bg-green">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Today's Sales Total</span>
            <span class="kpi-value">₹{{ todayTotal() | number:'1.2-2' }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card">
        <mat-card-content>
          <div class="kpi-icon-wrap bg-blue">
            <mat-icon>receipt</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Transactions Today</span>
            <span class="kpi-value">{{ todayCount() }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card">
        <mat-card-content>
          <div class="kpi-icon-wrap bg-purple">
            <mat-icon>badge</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Active Cashier</span>
            <span class="kpi-value-sm">{{ currentUser()?.fullName }}</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Quick Navigation Modules -->
    <div class="section-title no-print">
      <h2>Quick Actions</h2>
    </div>
    <div class="card-grid no-print">
      <mat-card class="action-card highlight" routerLink="/cashier/pos">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">point_of_sale</mat-icon>
          <mat-card-title>New Sale (POS)</mat-card-title>
          <mat-card-subtitle>Scan items, calculate totals & complete checkout</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <mat-card class="action-card" routerLink="/cashier/history">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">receipt_long</mat-icon>
          <mat-card-title>My Sales History</mat-card-title>
          <mat-card-subtitle>Review previous receipts and reprint orders</mat-card-subtitle>
        </mat-card-header>
      </mat-card>
    </div>

    <!-- Recent Sales Table -->
    <div class="recent-sales-section no-print">
      <div class="section-header-row">
        <h2>Your Recent Sales</h2>
        <a routerLink="/cashier/history" class="view-all-link">View All History →</a>
      </div>

      <mat-card class="table-card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Time</th>
                <th>Items Sold</th>
                <th style="text-align: right;">Total Amount</th>
                <th style="text-align: center; width: 100px;">Receipt</th>
              </tr>
            </thead>
            <tbody>
              @if (recentSales().length === 0 && !loading()) {
                <tr>
                  <td colspan="5" class="text-center py-4">No recent sales records for today.</td>
                </tr>
              }
              @for (sale of recentSales(); track sale.id) {
                <tr>
                  <td><code>{{ sale.receiptNumber }}</code></td>
                  <td>{{ sale.saleDate | date:'shortTime' }}</td>
                  <td>{{ sale.items?.length ?? 0 }} item(s)</td>
                  <td style="text-align: right;"><strong>₹{{ sale.totalAmount | number:'1.2-2' }}</strong></td>
                  <td style="text-align: center;">
                    <button mat-icon-button color="primary" (click)="viewReceipt(sale)" title="View Receipt">
                      <mat-icon>receipt</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </mat-card>
    </div>

    <!-- RECEIPT MODAL -->
    @if (selectedSale()) {
      <div class="receipt-backdrop no-print">
        <mat-card class="receipt-dialog-card">
          <div class="dialog-actions-top">
            <button mat-icon-button (click)="closeReceipt()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Printable Area -->
          <div class="printable-receipt receipt-paper">
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
                    <td style="text-align: right;">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                    <td style="text-align: right;">₹{{ item.lineTotal | number:'1.2-2' }}</td>
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
                <strong>₹{{ selectedSale()?.totalAmount | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div class="receipt-footer">
              <p>Thank you for shopping with us!</p>
              <small>Please retain this receipt for returns or exchanges.</small>
            </div>
          </div>

          <div class="modal-buttons no-print">
            <button mat-flat-button color="primary" (click)="printReceipt()">
              <mat-icon>print</mat-icon> Print Receipt
            </button>
            <button mat-stroked-button (click)="closeReceipt()">Close</button>
          </div>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .dashboard-header h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a237e;
    }
    .dashboard-header p {
      color: #475569;
      margin: 0;
    }
    .pos-action-btn {
      height: 48px;
      font-size: 1rem;
      padding: 0 1.5rem;
    }
    .mb-4 { margin-bottom: 1.5rem; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .kpi-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem !important;
    }
    .kpi-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kpi-icon-wrap mat-icon {
      color: white;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .bg-green { background: #16a34a; }
    .bg-blue { background: #2563eb; }
    .bg-purple { background: #7c3aed; }
    .kpi-info {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }
    .kpi-value-sm {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
    }
    .section-title h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .action-card {
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.12);
    }
    .action-card.highlight {
      border-left: 4px solid #1a237e;
    }
    .recent-sales-section {
      margin-top: 1rem;
    }
    .section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .section-header-row h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    .view-all-link {
      color: #1a237e;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .view-all-link:hover {
      text-decoration: underline;
    }
    .table-card {
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
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
    }
  `],
})
export class CashierDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly posService = inject(PosService);

  readonly currentUser = this.authService.currentUser;
  readonly loading = signal(false);

  readonly todayTotal = signal(0);
  readonly todayCount = signal(0);
  readonly recentSales = signal<SaleResponse[]>([]);
  readonly selectedSale = signal<SaleResponse | null>(null);

  ngOnInit(): void {
    this.loadTodaySummary();
  }

  loadTodaySummary(): void {
    this.loading.set(true);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startDate = `${todayStr}T00:00:00Z`;
    const endDate = `${todayStr}T23:59:59Z`;

    this.posService.getMySales(startDate, endDate, 0, 50).subscribe({
      next: (res) => {
        const sales = res.content ?? [];
        this.recentSales.set(sales.slice(0, 5));
        this.todayCount.set(res.totalElements ?? sales.length);
        const total = sales.reduce((sum, s) => sum + s.totalAmount, 0);
        this.todayTotal.set(Math.round(total * 100) / 100);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  viewReceipt(sale: SaleResponse): void {
    this.selectedSale.set(sale);
  }

  printReceipt(): void {
    window.print();
  }

  closeReceipt(): void {
    this.selectedSale.set(null);
  }
}
