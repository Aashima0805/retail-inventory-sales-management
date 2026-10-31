import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import {
  SalesSummaryResponse,
  TopProductResponse,
  InventoryReportResponse,
  AuditLogResponse,
} from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  template: `
    <div class="dashboard-header">
      <div>
        <h1>Admin Dashboard</h1>
        <p>Welcome back, <strong>{{ currentUser()?.fullName }}</strong>. Store overview and management controls.</p>
      </div>
      <div class="header-actions">
        <button mat-flat-button color="primary" routerLink="/admin/products">
          <mat-icon>add_box</mat-icon> Manage Products
        </button>
      </div>
    </div>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" class="mb-4"></mat-progress-bar>
    }

    <!-- KPI Metric Cards -->
    <div class="kpi-grid">
      <mat-card class="kpi-card sales-kpi">
        <mat-card-content>
          <div class="kpi-icon-wrap bg-blue">
            <mat-icon>payments</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Total Revenue</span>
            <span class="kpi-value">₹{{ (salesSummary()?.totalSalesAmount ?? 0) | number:'1.2-2' }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card transactions-kpi">
        <mat-card-content>
          <div class="kpi-icon-wrap bg-green">
            <mat-icon>receipt</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Total Sales</span>
            <span class="kpi-value">{{ salesSummary()?.numberOfSales ?? 0 }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card items-kpi">
        <mat-card-content>
          <div class="kpi-icon-wrap bg-purple">
            <mat-icon>shopping_bag</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Items Sold</span>
            <span class="kpi-value">{{ salesSummary()?.totalItemsSold ?? 0 }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="kpi-card alert-kpi">
        <mat-card-content>
          <div class="kpi-icon-wrap bg-amber">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="kpi-info">
            <span class="kpi-label">Low Stock Items</span>
            <span class="kpi-value text-amber">{{ lowStockCount() }}</span>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Quick Navigation Modules -->
    <div class="section-title">
      <h2>Management Modules</h2>
    </div>
    <div class="module-grid">
      <mat-card class="module-card" routerLink="/admin/products">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">inventory_2</mat-icon>
          <mat-card-title>Products & Categories</mat-card-title>
          <mat-card-subtitle>Catalog, prices, categories & stock status</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <mat-card class="module-card" routerLink="/admin/suppliers">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">local_shipping</mat-icon>
          <mat-card-title>Suppliers</mat-card-title>
          <mat-card-subtitle>Vendor directory & contacts</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <mat-card class="module-card" routerLink="/admin/staff">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">people</mat-icon>
          <mat-card-title>Staff Accounts</mat-card-title>
          <mat-card-subtitle>Manage users, credentials & roles</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <mat-card class="module-card" routerLink="/admin/reports">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">bar_chart</mat-icon>
          <mat-card-title>Sales & Inventory Reports</mat-card-title>
          <mat-card-subtitle>Revenue, top items & stock movement</mat-card-subtitle>
        </mat-card-header>
      </mat-card>

      <mat-card class="module-card" routerLink="/admin/audit-logs">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">history</mat-icon>
          <mat-card-title>Audit Logs</mat-card-title>
          <mat-card-subtitle>System transactions & security audit trail</mat-card-subtitle>
        </mat-card-header>
      </mat-card>
    </div>

    <!-- Detailed Insights Grid -->
    <div class="insights-grid">
      <!-- Low Stock Warnings -->
      <mat-card class="insight-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="text-amber">notification_important</mat-icon>
          <mat-card-title>Low Stock Alerts</mat-card-title>
          <mat-card-subtitle>Items below configured reorder level</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (lowStockItems().length === 0) {
            <p class="empty-state">All products are healthy above reorder thresholds.</p>
          } @else {
            <div class="table-container">
              <table class="simple-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Reorder Level</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of lowStockItems(); track item.productId) {
                    <tr>
                      <td><code>{{ item.sku }}</code></td>
                      <td>{{ item.name }}</td>
                      <td><span class="badge badge-danger">{{ item.currentStock }}</span></td>
                      <td>{{ item.reorderLevel }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Top Selling Products -->
      <mat-card class="insight-card">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">star</mat-icon>
          <mat-card-title>Top Selling Products</mat-card-title>
          <mat-card-subtitle>Best-selling items by total volume</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (topProducts().length === 0) {
            <p class="empty-state">No sales activity recorded yet.</p>
          } @else {
            <div class="table-container">
              <table class="simple-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th style="text-align: right;">Quantity Sold</th>
                  </tr>
                </thead>
                <tbody>
                  @for (prod of topProducts(); track prod.productId) {
                    <tr>
                      <td><strong>{{ prod.productName }}</strong></td>
                      <td><code>{{ prod.productSku }}</code></td>
                      <td style="text-align: right;"><span class="badge badge-success">{{ prod.totalQuantitySold }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Recent Audit Log Activity -->
      <mat-card class="insight-card span-full">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">schedule</mat-icon>
          <mat-card-title>Recent Activity</mat-card-title>
          <mat-card-subtitle>Latest operations recorded across the store</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (recentLogs().length === 0) {
            <p class="empty-state">No audit logs available.</p>
          } @else {
            <div class="table-container">
              <table class="simple-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event</th>
                    <th>Entity</th>
                    <th>Performed By</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  @for (log of recentLogs(); track log.id) {
                    <tr>
                      <td>{{ log.timestamp | date:'short' }}</td>
                      <td><span class="badge badge-info">{{ log.eventType }}</span></td>
                      <td>{{ log.entityName }} #{{ log.entityId }}</td>
                      <td>{{ log.performedByUsername ?? 'SYSTEM' }}</td>
                      <td>{{ log.description }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
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
    .mb-4 {
      margin-bottom: 1.5rem;
    }
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
    .bg-blue { background: #2563eb; }
    .bg-green { background: #16a34a; }
    .bg-purple { background: #7c3aed; }
    .bg-amber { background: #ea580c; }
    .text-amber { color: #ea580c; }
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
    .section-title h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 1rem;
    }
    .module-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .module-card {
      border-radius: 10px;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .module-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.1);
    }
    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1.5rem;
    }
    .span-full {
      grid-column: 1 / -1;
    }
    .insight-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .table-container {
      overflow-x: auto;
    }
    .simple-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }
    .simple-table th {
      text-align: left;
      padding: 8px 10px;
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
    }
    .simple-table td {
      padding: 8px 10px;
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
    .empty-state {
      color: #64748b;
      font-size: 0.9rem;
      font-style: italic;
      padding: 1rem 0;
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);

  readonly currentUser = this.authService.currentUser;
  readonly loading = signal(false);

  readonly salesSummary = signal<SalesSummaryResponse | null>(null);
  readonly topProducts = signal<TopProductResponse[]>([]);
  readonly lowStockItems = signal<InventoryReportResponse[]>([]);
  readonly lowStockCount = signal(0);
  readonly recentLogs = signal<AuditLogResponse[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading.set(true);

    this.adminService.getSalesSummary().subscribe({
      next: (summary) => this.salesSummary.set(summary),
      error: () => {},
    });

    this.adminService.getTopProducts(0, 5).subscribe({
      next: (res) => this.topProducts.set(res.content ?? []),
      error: () => {},
    });

    this.adminService.getInventoryReport(0, 100).subscribe({
      next: (res) => {
        const items = res.content ?? [];
        const low = items.filter((p) => p.isLowStock);
        this.lowStockItems.set(low);
        this.lowStockCount.set(low.length);
      },
      error: () => {},
    });

    this.adminService.getAuditLogs({ page: 0, size: 5 }).subscribe({
      next: (res) => {
        this.recentLogs.set(res.content ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
