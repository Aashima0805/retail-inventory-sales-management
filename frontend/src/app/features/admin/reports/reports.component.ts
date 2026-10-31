import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AdminService } from '../../../core/services/admin.service';
import {
  SalesSummaryResponse,
  SaleResponse,
  TopProductResponse,
  InventoryReportResponse,
  StockReceiptResponse,
  StockAdjustmentResponse,
} from '../../../core/models/admin.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatButtonToggleModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <h1>Analytics & Operational Reports</h1>
        <p>Comprehensive sales summaries, inventory health and stock movement logs.</p>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-3"></mat-progress-bar>
      }

      <mat-card class="content-card">
        <mat-tab-group animationDuration="0ms" (selectedTabChange)="onTabChange($event.index)">
          <!-- TAB 1: SALES TRANSACTIONS & SUMMARY -->
          <mat-tab label="Sales Summary & Receipts">
            <div class="tab-body">
              <!-- Summary KPI Cards -->
              <div class="kpi-grid">
                <div class="kpi-box">
                  <span class="kpi-label">Total Sales Volume</span>
                  <span class="kpi-num">₹{{ (salesSummary()?.totalSalesAmount ?? 0) | number:'1.2-2' }}</span>
                </div>
                <div class="kpi-box">
                  <span class="kpi-label">Completed Transactions</span>
                  <span class="kpi-num">{{ salesSummary()?.numberOfSales ?? 0 }}</span>
                </div>
                <div class="kpi-box">
                  <span class="kpi-label">Total Units Sold</span>
                  <span class="kpi-num">{{ salesSummary()?.totalItemsSold ?? 0 }}</span>
                </div>
              </div>

              <!-- Date Filter -->
              <div class="filter-bar">
                <mat-form-field appearance="outline" density="compact">
                  <mat-label>Start Date (ISO / YYYY-MM-DD)</mat-label>
                  <input matInput [(ngModel)]="salesStartDate" placeholder="2026-01-01T00:00:00Z" />
                </mat-form-field>

                <mat-form-field appearance="outline" density="compact">
                  <mat-label>End Date (ISO / YYYY-MM-DD)</mat-label>
                  <input matInput [(ngModel)]="salesEndDate" placeholder="2026-12-31T23:59:59Z" />
                </mat-form-field>

                <button mat-flat-button color="primary" (click)="loadSalesData()">Filter Sales</button>
                <button mat-stroked-button (click)="resetSalesFilter()">Reset</button>
              </div>

              <!-- Transactions Table -->
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Cashier</th>
                      <th>Items Count</th>
                      <th style="text-align: right;">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (sales().length === 0) {
                      <tr>
                        <td colspan="5" class="text-center py-4">No sales records found for this period.</td>
                      </tr>
                    }
                    @for (s of sales(); track s.id) {
                      <tr>
                        <td><code>{{ s.receiptNumber }}</code></td>
                        <td>{{ s.saleDate | date:'medium' }}</td>
                        <td>{{ s.cashierFullName }} ({{ s.cashierUsername }})</td>
                        <td>{{ s.items.length }} item(s)</td>
                        <td style="text-align: right;"><strong>₹{{ s.totalAmount | number:'1.2-2' }}</strong></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- TAB 2: TOP PRODUCTS -->
          <mat-tab label="Top Selling Products">
            <div class="tab-body">
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width: 60px;">Rank</th>
                      <th>Product SKU</th>
                      <th>Product Name</th>
                      <th style="text-align: right;">Units Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (topProducts().length === 0) {
                      <tr>
                        <td colspan="4" class="text-center py-4">No sales data available.</td>
                      </tr>
                    }
                    @for (item of topProducts(); track item.productId; let i = $index) {
                      <tr>
                        <td><span class="rank-badge">{{ i + 1 }}</span></td>
                        <td><code>{{ item.productSku }}</code></td>
                        <td><strong>{{ item.productName }}</strong></td>
                        <td style="text-align: right;"><span class="badge badge-success">{{ item.totalQuantitySold }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- TAB 3: INVENTORY HEALTH -->
          <mat-tab label="Inventory Stock Report">
            <div class="tab-body">
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product</th>
                      <th>Unit Price</th>
                      <th>Current Stock</th>
                      <th>Reorder Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (inventoryReport().length === 0) {
                      <tr>
                        <td colspan="6" class="text-center py-4">No inventory data available.</td>
                      </tr>
                    }
                    @for (item of inventoryReport(); track item.productId) {
                      <tr>
                        <td><code>{{ item.sku }}</code></td>
                        <td><strong>{{ item.name }}</strong></td>
                        <td>₹{{ item.price | number:'1.2-2' }}</td>
                        <td>
                          <span class="badge" [class.badge-danger]="item.isLowStock" [class.badge-success]="!item.isLowStock">
                            {{ item.currentStock }}
                          </span>
                        </td>
                        <td>{{ item.reorderLevel }}</td>
                        <td>
                          @if (item.isLowStock) {
                            <span class="badge badge-danger">Low Stock Alert</span>
                          } @else {
                            <span class="badge badge-success">Adequate</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- TAB 4: STOCK MOVEMENTS -->
          <mat-tab label="Stock Movements">
            <div class="tab-body">
              <div class="toolbar-split">
                <mat-button-toggle-group [ngModel]="movementType" (ngModelChange)="onMovementTypeChange($event)">
                  <mat-button-toggle value="RECEIPTS">Incoming Receipts</mat-button-toggle>
                  <mat-button-toggle value="ADJUSTMENTS">Stock Adjustments</mat-button-toggle>
                </mat-button-toggle-group>
              </div>

              <!-- Receipts Table -->
              @if (movementType === 'RECEIPTS') {
                <div class="table-wrap mt-3">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Receipt Ref</th>
                        <th>Supplier</th>
                        <th>Received By</th>
                        <th>Date</th>
                        <th>Total Qty</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (receipts().length === 0) {
                        <tr>
                          <td colspan="6" class="text-center py-4">No stock receipts recorded.</td>
                        </tr>
                      }
                      @for (r of receipts(); track r.id) {
                        <tr>
                          <td><code>{{ r.receiptReference }}</code></td>
                          <td><strong>{{ r.supplierName }}</strong></td>
                          <td>{{ r.receivedByUsername }}</td>
                          <td>{{ r.receivedDate | date:'mediumDate' }}</td>
                          <td><span class="badge badge-info">{{ r.totalQuantityReceived }}</span></td>
                          <td>{{ r.notes ?? '-' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <!-- Adjustments Table -->
              @if (movementType === 'ADJUSTMENTS') {
                <div class="table-wrap mt-3">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product</th>
                        <th>Adjusted By</th>
                        <th>Date</th>
                        <th>Previous Stock</th>
                        <th>Quantity Change</th>
                        <th>New Stock</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (adjustments().length === 0) {
                        <tr>
                          <td colspan="8" class="text-center py-4">No stock adjustments recorded.</td>
                        </tr>
                      }
                      @for (a of adjustments(); track a.id) {
                        <tr>
                          <td><code>{{ a.productSku }}</code></td>
                          <td><strong>{{ a.productName }}</strong></td>
                          <td>{{ a.performedByUsername }}</td>
                          <td>{{ a.adjustmentDate | date:'medium' }}</td>
                          <td>{{ a.previousStock }}</td>
                          <td>
                            <span class="badge" [class.badge-danger]="a.quantityChange < 0" [class.badge-success]="a.quantityChange > 0">
                              {{ a.quantityChange > 0 ? '+' : '' }}{{ a.quantityChange }}
                            </span>
                          </td>
                          <td><strong>{{ a.newStock }}</strong></td>
                          <td>{{ a.reason }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
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
    .mt-3 { margin-top: 1rem; }
    .content-card {
      border-radius: 12px;
      overflow: hidden;
    }
    .tab-body {
      padding: 1.5rem;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .kpi-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.8rem;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .kpi-num {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a237e;
      margin-top: 0.25rem;
    }
    .filter-bar {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .toolbar-split {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
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
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    .badge-success { background: #dcfce7; color: #16a34a; }
    .badge-info { background: #e0e7ff; color: #4338ca; }
    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e2e8f0;
      font-weight: 700;
      font-size: 0.8rem;
      color: #334155;
    }
  `],
})
export class ReportsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(false);

  // Sales
  readonly salesSummary = signal<SalesSummaryResponse | null>(null);
  readonly sales = signal<SaleResponse[]>([]);
  salesStartDate = '';
  salesEndDate = '';

  // Top Products
  readonly topProducts = signal<TopProductResponse[]>([]);

  // Inventory
  readonly inventoryReport = signal<InventoryReportResponse[]>([]);

  // Movements
  movementType: 'RECEIPTS' | 'ADJUSTMENTS' = 'RECEIPTS';
  readonly receipts = signal<StockReceiptResponse[]>([]);
  readonly adjustments = signal<StockAdjustmentResponse[]>([]);

  ngOnInit(): void {
    this.loadSalesData();
  }

  onTabChange(index: number): void {
    switch (index) {
      case 0: this.loadSalesData(); break;
      case 1: this.loadTopProducts(); break;
      case 2: this.loadInventory(); break;
      case 3: this.loadMovements(); break;
    }
  }

  loadSalesData(): void {
    this.loading.set(true);
    const start = this.salesStartDate.trim() || undefined;
    const end = this.salesEndDate.trim() || undefined;

    this.adminService.getSalesSummary(start, end).subscribe({
      next: (summary) => this.salesSummary.set(summary),
      error: () => {},
    });

    this.adminService.getSalesReport({ startDate: start, endDate: end, page: 0, size: 50 }).subscribe({
      next: (res) => {
        this.sales.set(res.content ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  resetSalesFilter(): void {
    this.salesStartDate = '';
    this.salesEndDate = '';
    this.loadSalesData();
  }

  loadTopProducts(): void {
    this.loading.set(true);
    this.adminService.getTopProducts(0, 20).subscribe({
      next: (res) => {
        this.topProducts.set(res.content ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadInventory(): void {
    this.loading.set(true);
    this.adminService.getInventoryReport(0, 100).subscribe({
      next: (res) => {
        this.inventoryReport.set(res.content ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onMovementTypeChange(type: 'RECEIPTS' | 'ADJUSTMENTS'): void {
    this.movementType = type;
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading.set(true);
    this.adminService.getStockMovements(this.movementType, { page: 0, size: 50 }).subscribe({
      next: (res) => {
        if (this.movementType === 'RECEIPTS') {
          this.receipts.set((res.content as StockReceiptResponse[]) ?? []);
        } else {
          this.adjustments.set((res.content as StockAdjustmentResponse[]) ?? []);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
