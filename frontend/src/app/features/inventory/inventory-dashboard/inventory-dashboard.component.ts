import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { Product, StockReceiptResponse } from '../../../core/models/admin.models';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="dashboard-header">
      <div>
        <h1>Inventory Dashboard</h1>
        <p>Welcome, <strong>{{ currentUser()?.fullName ?? currentUser()?.username }}</strong>. Manage stock levels, alerts and incoming shipments.</p>
      </div>
      <div class="header-actions">
        <button mat-raised-button color="accent" routerLink="/inventory/receive">
          <mat-icon>move_to_inbox</mat-icon> Receive Stock
        </button>
      </div>
    </div>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" class="mb-4"></mat-progress-bar>
    }

    <!-- KPI Metric Cards -->
    <div class="kpi-grid">
      <mat-card class="kpi-card" routerLink="/inventory/stock">
        <mat-card-content>
          <div class="kpi-icon-wrap bg-blue">
            <mat-icon>inventory_2</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Total Products</span>
            <span class="kpi-value">{{ totalProducts() }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card" [class.kpi-alert]="lowStockCount() > 0" routerLink="/inventory/stock">
        <mat-card-content>
          <div class="kpi-icon-wrap" [class.bg-orange]="lowStockCount() > 0" [class.bg-gray]="lowStockCount() === 0">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Low Stock Alerts</span>
            <span class="kpi-value" [class.text-warn]="lowStockCount() > 0">{{ lowStockCount() }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card" routerLink="/inventory/receipts">
        <mat-card-content>
          <div class="kpi-icon-wrap bg-green">
            <mat-icon>local_shipping</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Recent Receipts</span>
            <span class="kpi-value">{{ totalReceipts() }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card">
        <mat-card-content>
          <div class="kpi-icon-wrap bg-purple">
            <mat-icon>storefront</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Active Suppliers</span>
            <span class="kpi-value">{{ totalSuppliers() }}</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Low Stock Alert Banner / Panel -->
    @if (lowStockCount() > 0) {
      <div class="alert-section">
        <div class="section-header-row">
          <div class="alert-title">
            <mat-icon class="warn-icon">error_outline</mat-icon>
            <h2>Low Stock Items Needing Reorder ({{ lowStockCount() }})</h2>
          </div>
          <a routerLink="/inventory/stock" class="view-all-link">View All Alerts →</a>
        </div>

        <mat-card class="table-card">
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th style="text-align: right;">Current Stock</th>
                  <th style="text-align: right;">Reorder Level</th>
                  <th style="text-align: center;">Status</th>
                  <th style="text-align: center; width: 130px;">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (prod of lowStockProducts().slice(0, 5); track prod.id) {
                  <tr>
                    <td><strong>{{ prod.name }}</strong></td>
                    <td><code>{{ prod.sku }}</code></td>
                    <td style="text-align: right;">
                      <span class="stock-num" [class.zero]="prod.currentStock === 0">{{ prod.currentStock }}</span>
                    </td>
                    <td style="text-align: right;">{{ prod.reorderLevel }}</td>
                    <td style="text-align: center;">
                      @if (prod.currentStock === 0) {
                        <span class="badge badge-out">Out of Stock</span>
                      } @else {
                        <span class="badge badge-low">Low Stock</span>
                      }
                    </td>
                    <td style="text-align: center;">
                      <button
                        mat-button
                        color="primary"
                        routerLink="/inventory/receive"
                        [queryParams]="{ productId: prod.id }"
                        class="reorder-btn"
                      >
                        <mat-icon>add_circle</mat-icon> Receive Stock
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mat-card>
      </div>
    }

    <!-- Quick Action Navigation Modules -->
    <div class="section-title">
      <h2>Quick Actions</h2>
    </div>
    <div class="actions-grid">
      <mat-card class="action-card highlight" routerLink="/inventory/receive">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">move_to_inbox</mat-icon>
          <mat-card-title>Receive Incoming Stock</mat-card-title>
          <mat-card-subtitle>Record supplier shipments, PO deliveries and generate receipt vouchers</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <mat-card class="action-card" routerLink="/inventory/stock">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">inventory_2</mat-icon>
          <mat-card-title>Stock Levels & Alerts</mat-card-title>
          <mat-card-subtitle>Browse catalog balances, filter low stock items and review thresholds</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <mat-card class="action-card" routerLink="/inventory/receipts">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">receipt_long</mat-icon>
          <mat-card-title>Receipt History</mat-card-title>
          <mat-card-subtitle>View past shipment records, supplier audit trails and delivery breakdown</mat-card-subtitle>
        </mat-card-header>
      </mat-card>
    </div>

    <!-- Recent Receipts Table -->
    <div class="recent-section">
      <div class="section-header-row">
        <h2>Recent Stock Receipts</h2>
        <a routerLink="/inventory/receipts" class="view-all-link">View All Receipts →</a>
      </div>

      <mat-card class="table-card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Received Date</th>
                <th>Supplier</th>
                <th>Received By</th>
                <th style="text-align: right;">Total Units</th>
                <th style="text-align: center; width: 90px;">Details</th>
              </tr>
            </thead>
            <tbody>
              @if (recentReceipts().length === 0 && !loading()) {
                <tr>
                  <td colspan="6" class="text-center py-4">No recent stock receipts found.</td>
                </tr>
              }
              @for (receipt of recentReceipts(); track receipt.id) {
                <tr>
                  <td><code>{{ receipt.receiptReference }}</code></td>
                  <td>{{ receipt.receivedDate | date:'medium' }}</td>
                  <td><strong>{{ receipt.supplierName }}</strong></td>
                  <td>{{ receipt.receivedByUsername }}</td>
                  <td style="text-align: right;">
                    <span class="units-badge">{{ receipt.totalQuantityReceived }} units</span>
                  </td>
                  <td style="text-align: center;">
                    <button mat-icon-button color="primary" (click)="viewReceipt(receipt)" title="View Receipt">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </mat-card>
    </div>

    <!-- QUICK RECEIPT DETAILS MODAL -->
    @if (selectedReceipt(); as receipt) {
      <div class="modal-backdrop">
        <mat-card class="modal-card">
          <div class="modal-header">
            <div>
              <h2>Receipt Details</h2>
              <code class="ref-badge">{{ receipt.receiptReference }}</code>
            </div>
            <button mat-icon-button (click)="closeReceipt()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <mat-divider></mat-divider>

          <div class="modal-body">
            <div class="info-grid">
              <div>
                <span class="info-label">Supplier:</span>
                <strong>{{ receipt.supplierName }}</strong>
              </div>
              <div>
                <span class="info-label">Date:</span>
                <strong>{{ receipt.receivedDate | date:'medium' }}</strong>
              </div>
              <div>
                <span class="info-label">Received By:</span>
                <strong>{{ receipt.receivedByUsername }}</strong>
              </div>
              <div>
                <span class="info-label">Total Units:</span>
                <strong>{{ receipt.totalQuantityReceived }} units</strong>
              </div>
              @if (receipt.notes) {
                <div class="span-2">
                  <span class="info-label">Notes:</span>
                  <span>{{ receipt.notes }}</span>
                </div>
              }
            </div>

            <h3>Line Items</h3>
            <div class="table-wrap">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th style="text-align: right;">Quantity</th>
                    <th style="text-align: right;">Unit Cost</th>
                    <th style="text-align: right;">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of receipt.items; track item.id) {
                    <tr>
                      <td><strong>{{ item.productName }}</strong></td>
                      <td><code>{{ item.productSku }}</code></td>
                      <td style="text-align: right; font-weight: 600;">+{{ item.quantityReceived }}</td>
                      <td style="text-align: right;">₹{{ item.unitCost | number:'1.2-2' }}</td>
                      <td style="text-align: right; font-weight: 600;">
                        ₹{{ (item.quantityReceived * item.unitCost) | number:'1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <mat-divider></mat-divider>

          <div class="modal-footer">
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
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .dashboard-header h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1a237e;
    }
    .dashboard-header p {
      color: #475569;
      margin: 0;
    }
    .mb-4 {
      margin-bottom: 1.5rem;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .kpi-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
    }
    .kpi-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kpi-icon-wrap mat-icon {
      color: white;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .bg-blue   { background: #1976d2; }
    .bg-green  { background: #2e7d32; }
    .bg-orange { background: #e65100; }
    .bg-gray   { background: #78909c; }
    .bg-purple { background: #6a1b9a; }
    .kpi-info {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 1.6rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.2;
    }
    .text-warn {
      color: #d84315;
    }
    .alert-section {
      margin-bottom: 2rem;
    }
    .alert-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .alert-title h2 {
      margin: 0;
      font-size: 1.15rem;
      color: #c62828;
      font-weight: 600;
    }
    .warn-icon {
      color: #c62828;
    }
    .section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .section-title h2 {
      font-size: 1.15rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.75rem;
    }
    .view-all-link {
      font-size: 0.85rem;
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }
    .view-all-link:hover {
      text-decoration: underline;
    }
    .table-card {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      background: white;
    }
    .table-wrap {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
      padding: 10px 14px;
      border-bottom: 2px solid #e2e8f0;
    }
    .data-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .stock-num {
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: #fff8e1;
      color: #b78103;
    }
    .stock-num.zero {
      background: #ffebee;
      color: #c62828;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-low {
      background: #fff3e0;
      color: #e65100;
    }
    .badge-out {
      background: #ffebee;
      color: #c62828;
    }
    .reorder-btn {
      font-size: 0.8rem;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .action-card {
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .action-card.highlight {
      border: 2px solid #3f51b5;
    }
    .units-badge {
      background: #e8eaf6;
      color: #283593;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.8rem;
    }
    .recent-section {
      margin-bottom: 2rem;
    }
    .text-center {
      text-align: center;
    }
    .py-4 {
      padding-top: 1.5rem;
      padding-bottom: 1.5rem;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-card {
      max-width: 650px;
      width: 100%;
      border-radius: 12px;
      padding: 1.5rem;
      background: white;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .modal-header h2 {
      margin: 0 0 4px;
      font-size: 1.35rem;
      color: #1e293b;
    }
    .ref-badge {
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 700;
    }
    .modal-body {
      padding: 1.25rem 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem 1rem;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    .info-label {
      color: #64748b;
      margin-right: 6px;
    }
    .span-2 {
      grid-column: span 2;
    }
    .modal-body h3 {
      font-size: 1rem;
      color: #334155;
      margin: 0 0 0.5rem;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .detail-table th {
      background: #f8fafc;
      color: #475569;
      padding: 8px 10px;
      border-bottom: 1px solid #cbd5e1;
    }
    .detail-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }
  `],
})
export class InventoryDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly inventoryService = inject(InventoryService);

  readonly currentUser = this.authService.currentUser;
  readonly loading = signal(false);

  readonly totalProducts = signal(0);
  readonly lowStockCount = signal(0);
  readonly totalReceipts = signal(0);
  readonly totalSuppliers = signal(0);

  readonly lowStockProducts = signal<Product[]>([]);
  readonly recentReceipts = signal<StockReceiptResponse[]>([]);
  readonly selectedReceipt = signal<StockReceiptResponse | null>(null);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);

    // 1. Load stock count
    this.inventoryService.getStockListing(0, 1).subscribe({
      next: (res) => this.totalProducts.set(res.totalElements ?? 0),
      error: () => {},
    });

    // 2. Load low stock items
    this.inventoryService.getLowStockProducts(0, 50).subscribe({
      next: (res) => {
        const items = res.content ?? [];
        this.lowStockProducts.set(items);
        this.lowStockCount.set(res.totalElements ?? items.length);
      },
      error: () => {},
    });

    // 3. Load recent receipts
    this.inventoryService.getReceiptHistory(undefined, undefined, 0, 5).subscribe({
      next: (res) => {
        this.recentReceipts.set(res.content ?? []);
        this.totalReceipts.set(res.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });

    // 4. Load suppliers count
    this.inventoryService.getActiveSuppliers().subscribe({
      next: (res) => this.totalSuppliers.set(res.totalElements ?? res.content?.length ?? 0),
      error: () => {},
    });
  }

  viewReceipt(receipt: StockReceiptResponse): void {
    this.selectedReceipt.set(receipt);
  }

  closeReceipt(): void {
    this.selectedReceipt.set(null);
  }
}
