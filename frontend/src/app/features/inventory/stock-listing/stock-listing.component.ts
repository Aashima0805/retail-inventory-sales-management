import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { Product } from '../../../core/models/admin.models';

@Component({
  selector: 'app-stock-listing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <div>
          <h1>Stock Levels & Low-Stock Alerts</h1>
          <p>Monitor real-time inventory levels, reorder thresholds and shortages.</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="accent" routerLink="/inventory/receive">
            <mat-icon>move_to_inbox</mat-icon> Receive Stock
          </button>
        </div>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-3"></mat-progress-bar>
      }

      <!-- Low Stock Alert Banner -->
      @if (lowStockCount() > 0) {
        <div class="alert-banner">
          <div class="alert-icon-box">
            <mat-icon>warning</mat-icon>
          </div>
          <div class="alert-content">
            <strong>{{ lowStockCount() }} product(s) are at or below reorder level!</strong>
            <p>Replenishment is required to prevent stockouts.</p>
          </div>
          <button mat-flat-button color="warn" (click)="filterMode = 'low'; applyFilter()">
            View Low Stock Items
          </button>
        </div>
      }

      <mat-card class="content-card">
        <!-- Filter Toolbar -->
        <div class="toolbar">
          <mat-form-field appearance="outline" density="compact" class="search-input">
            <mat-label>Search Product Name / SKU</mat-label>
            <input matInput [(ngModel)]="searchKeyword" (ngModelChange)="applyFilter()" placeholder="e.g. Milk, BEV-001" />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-button-toggle-group [(ngModel)]="filterMode" (change)="onFilterModeChange()">
            <mat-button-toggle value="all">All Products ({{ totalElements() }})</mat-button-toggle>
            <mat-button-toggle value="low" class="toggle-warn">
              Low Stock Alerts ({{ lowStockCount() }})
            </mat-button-toggle>
          </mat-button-toggle-group>

          <button mat-stroked-button (click)="refresh()" [disabled]="loading()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>

        <!-- Stock Table -->
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th style="text-align: right;">Current Stock</th>
                <th style="text-align: right;">Reorder Level</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: center;">Status</th>
                <th style="text-align: center; width: 120px;">Action</th>
              </tr>
            </thead>
            <tbody>
              @if (displayedProducts().length === 0 && !loading()) {
                <tr>
                  <td colspan="8" class="text-center py-4">No matching products found.</td>
                </tr>
              }
              @for (product of displayedProducts(); track product.id) {
                <tr [class.row-alert]="product.currentStock <= product.reorderLevel">
                  <td>
                    <strong>{{ product.name }}</strong>
                    @if (product.description) {
                      <div class="product-desc">{{ product.description }}</div>
                    }
                  </td>
                  <td><code>{{ product.sku }}</code></td>
                  <td>{{ product.category.name || '—' }}</td>
                  <td style="text-align: right;">
                    <span class="stock-qty" [class.qty-zero]="product.currentStock === 0" [class.qty-low]="product.currentStock > 0 && product.currentStock <= product.reorderLevel">
                      {{ product.currentStock }}
                    </span>
                  </td>
                  <td style="text-align: right;">{{ product.reorderLevel }}</td>
                  <td style="text-align: right;">₹{{ product.price | number:'1.2-2' }}</td>
                  <td style="text-align: center;">
                    @if (product.currentStock === 0) {
                      <span class="badge badge-out">Out of Stock</span>
                    } @else if (product.currentStock <= product.reorderLevel) {
                      <span class="badge badge-low">Low Stock</span>
                    } @else {
                      <span class="badge badge-ok">In Stock</span>
                    }
                  </td>
                  <td style="text-align: center;">
                    <div class="row-actions">
                      @if (isAdmin()) {
                        <button
                          mat-button
                          color="accent"
                          (click)="openAdjustmentDialog(product)"
                          class="action-btn"
                          title="Manual Stock Adjustment (Admin only)"
                        >
                          <mat-icon>tune</mat-icon> Adjust
                        </button>
                      }
                      <button
                        mat-button
                        color="primary"
                        routerLink="/inventory/receive"
                        [queryParams]="{ productId: product.id, supplierId: null }"
                        class="action-btn"
                      >
                        <mat-icon>add_circle_outline</mat-icon> Receive
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (filterMode === 'all' && totalPages() > 1) {
          <div class="pagination-bar">
            <span>Page {{ currentPage() + 1 }} of {{ totalPages() }} ({{ totalElements() }} items)</span>
            <div class="page-controls">
              <button mat-icon-button [disabled]="currentPage() === 0" (click)="goToPage(currentPage() - 1)">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <button mat-icon-button [disabled]="currentPage() >= totalPages() - 1" (click)="goToPage(currentPage() + 1)">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }
      </mat-card>

      <!-- STOCK ADJUSTMENT MODAL (ADMIN ONLY) -->
      @if (adjustingProduct(); as product) {
        <div class="modal-backdrop">
          <mat-card class="modal-dialog-card">
            <div class="modal-header">
              <div class="header-title-wrap">
                <mat-icon color="accent" class="modal-title-icon">tune</mat-icon>
                <div>
                  <h2>Adjust Stock Level</h2>
                  <p>Product: <strong>{{ product.name }}</strong> (<code>{{ product.sku }}</code>)</p>
                </div>
              </div>
              <button mat-icon-button (click)="closeAdjustmentDialog()" [disabled]="adjustmentLoading()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <mat-divider></mat-divider>

            <div class="modal-body">
              <div class="stock-overview-box">
                <div class="stat-col">
                  <span class="stat-label">Current Stock</span>
                  <span class="stat-val">{{ product.currentStock }}</span>
                </div>
                <div class="stat-col-arrow">
                  <mat-icon>arrow_forward</mat-icon>
                </div>
                <div class="stat-col">
                  <span class="stat-label">Adjustment</span>
                  <span class="stat-val" [class.text-green]="adjustmentQuantityChange > 0" [class.text-red]="adjustmentQuantityChange < 0">
                    {{ adjustmentQuantityChange > 0 ? '+' + adjustmentQuantityChange : adjustmentQuantityChange }}
                  </span>
                </div>
                <div class="stat-col-arrow">
                  <mat-icon>trending_flat</mat-icon>
                </div>
                <div class="stat-col">
                  <span class="stat-label">New Balance</span>
                  <span class="stat-val new-balance" [class.text-red]="(product.currentStock + adjustmentQuantityChange) < 0">
                    {{ product.currentStock + adjustmentQuantityChange }}
                  </span>
                </div>
              </div>

              @if ((product.currentStock + adjustmentQuantityChange) < 0) {
                <div class="warning-banner">
                  <mat-icon>error</mat-icon>
                  <span>Resulting stock cannot be negative. Maximum reduction is {{ product.currentStock }}.</span>
                </div>
              }

              <div class="form-group-field">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Quantity Change (+/-)</mat-label>
                  <input
                    matInput
                    type="number"
                    [(ngModel)]="adjustmentQuantityChange"
                    placeholder="e.g. -5 for damage, +10 for correction"
                    required
                  />
                  <mat-hint>Enter negative number to reduce, positive to increase.</mat-hint>
                </mat-form-field>
              </div>

              <div class="quick-reasons-wrap">
                <span class="quick-reasons-label">Common Reasons:</span>
                <div class="chips-list">
                  <button type="button" class="reason-pill" (click)="setReason('Damaged / Broken stock')">Damaged</button>
                  <button type="button" class="reason-pill" (click)="setReason('Annual inventory audit discrepancy')">Audit Discrepancy</button>
                  <button type="button" class="reason-pill" (click)="setReason('Stock shrinkage / Lost')">Shrinkage / Loss</button>
                  <button type="button" class="reason-pill" (click)="setReason('Expired / spoiled goods')">Expired / Spoiled</button>
                  <button type="button" class="reason-pill" (click)="setReason('Returned to stock')">Returned</button>
                </div>
              </div>

              <div class="form-group-field">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Adjustment Reason *</mat-label>
                  <input
                    matInput
                    [(ngModel)]="adjustmentReason"
                    placeholder="Explain why this manual adjustment is being recorded"
                    maxlength="255"
                    required
                  />
                </mat-form-field>
              </div>

              @if (adjustmentFeedback()) {
                <div class="warning-banner" style="background: #fee2e2; color: #991b1b;">
                  <span>{{ adjustmentFeedback() }}</span>
                </div>
              }
            </div>

            <mat-divider></mat-divider>

            <div class="modal-footer">
              <button mat-button (click)="closeAdjustmentDialog()" [disabled]="adjustmentLoading()">Cancel</button>
              <button
                mat-raised-button
                color="primary"
                (click)="submitStockAdjustment()"
                [disabled]="adjustmentLoading() || !isAdjustmentValid()"
              >
                <mat-icon>check_circle</mat-icon>
                {{ adjustmentLoading() ? 'Saving...' : 'Apply Stock Adjustment' }}
              </button>
            </div>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-section h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 600;
      color: #1a237e;
    }
    .header-section p {
      color: #475569;
      margin: 0;
    }
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #fff3e0;
      border: 1px solid #ffe0b2;
      border-left: 5px solid #f57c00;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .alert-icon-box mat-icon {
      color: #f57c00;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .alert-content {
      flex: 1;
    }
    .alert-content strong {
      color: #b78103;
      font-size: 1rem;
      display: block;
    }
    .alert-content p {
      margin: 2px 0 0;
      color: #795548;
      font-size: 0.85rem;
    }
    .content-card {
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      background: white;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .search-input {
      min-width: 280px;
      flex: 1;
    }
    .toggle-warn {
      color: #c62828 !important;
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
    .row-alert {
      background-color: #fffbf0;
    }
    .product-desc {
      font-size: 0.78rem;
      color: #64748b;
    }
    .stock-qty {
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .qty-zero {
      color: #c62828;
      background: #ffebee;
    }
    .qty-low {
      color: #b78103;
      background: #fff8e1;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-ok {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .badge-low {
      background: #fff3e0;
      color: #e65100;
    }
    .badge-out {
      background: #ffebee;
      color: #c62828;
    }
    .receive-btn {
      font-size: 0.8rem;
    }
    .row-actions {
      display: flex;
      gap: 4px;
      justify-content: center;
      align-items: center;
    }
    .action-btn {
      font-size: 0.8rem;
    }
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
    .modal-dialog-card {
      max-width: 550px;
      width: 100%;
      border-radius: 12px;
      padding: 1.5rem;
      background: white;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    .header-title-wrap {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .modal-title-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }
    .modal-header p {
      margin: 2px 0 0;
      font-size: 0.85rem;
      color: #64748b;
    }
    .modal-body {
      padding: 1rem 0;
    }
    .stock-overview-box {
      display: flex;
      justify-content: space-around;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.25rem;
    }
    .stat-col {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .stat-val {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1e293b;
    }
    .new-balance {
      color: #1a237e;
    }
    .stat-col-arrow mat-icon {
      color: #94a3b8;
    }
    .text-green { color: #16a34a !important; }
    .text-red { color: #dc2626 !important; }
    .warning-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fee2e2;
      color: #991b1b;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }
    .form-group-field {
      margin-bottom: 0.5rem;
    }
    .w-100 {
      width: 100%;
    }
    .quick-reasons-wrap {
      margin-bottom: 1rem;
    }
    .quick-reasons-label {
      font-size: 0.8rem;
      color: #64748b;
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .chips-list {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .reason-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 4px 10px;
      font-size: 0.75rem;
      color: #334155;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .reason-pill:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      color: #64748b;
      font-size: 0.85rem;
    }
    .mb-3 {
      margin-bottom: 0.75rem;
    }
    .text-center {
      text-align: center;
    }
    .py-4 {
      padding-top: 1.5rem;
      padding-bottom: 1.5rem;
    }
  `],
})
export class StockListingComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly authService = inject(AuthService);

  readonly isAdmin = this.authService.isAdmin;
  readonly loading = signal(false);
  readonly allProducts = signal<Product[]>([]);
  readonly lowStockProducts = signal<Product[]>([]);
  readonly displayedProducts = signal<Product[]>([]);
  readonly lowStockCount = signal(0);

  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);

  searchKeyword = '';
  filterMode: 'all' | 'low' = 'all';

  // Stock Adjustment state (Admin only)
  readonly adjustingProduct = signal<Product | null>(null);
  readonly adjustmentLoading = signal(false);
  readonly adjustmentFeedback = signal<string | null>(null);
  adjustmentQuantityChange = 0;
  adjustmentReason = '';

  ngOnInit(): void {
    this.loadLowStock();
    this.loadStock(0);
  }

  loadLowStock(): void {
    this.inventoryService.getLowStockProducts(0, 500).subscribe({
      next: (page) => {
        const list = page.content ?? [];
        this.lowStockProducts.set(list);
        this.lowStockCount.set(list.length);
        if (this.filterMode === 'low') {
          this.applyFilter();
        }
      },
      error: () => {},
    });
  }

  loadStock(page: number): void {
    this.loading.set(true);
    this.inventoryService.getStockListing(page, 20).subscribe({
      next: (res) => {
        this.allProducts.set(res.content ?? []);
        this.currentPage.set(res.number ?? page);
        this.totalPages.set(res.totalPages ?? 0);
        this.totalElements.set(res.totalElements ?? 0);
        this.loading.set(false);
        this.applyFilter();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onFilterModeChange(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    const list = this.filterMode === 'low' ? this.lowStockProducts() : this.allProducts();
    const kw = this.searchKeyword.trim().toLowerCase();
    if (!kw) {
      this.displayedProducts.set(list);
    } else {
      this.displayedProducts.set(
        list.filter(
          (p) =>
            p.name.toLowerCase().includes(kw) ||
            p.sku.toLowerCase().includes(kw) ||
            p.category?.name?.toLowerCase().includes(kw)
        )
      );
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadStock(page);
    }
  }

  refresh(): void {
    this.loadLowStock();
    this.loadStock(this.currentPage());
  }

  // Stock Adjustment methods
  openAdjustmentDialog(p: Product): void {
    this.adjustingProduct.set(p);
    this.adjustmentQuantityChange = 0;
    this.adjustmentReason = '';
    this.adjustmentFeedback.set(null);
  }

  closeAdjustmentDialog(): void {
    this.adjustingProduct.set(null);
    this.adjustmentQuantityChange = 0;
    this.adjustmentReason = '';
    this.adjustmentFeedback.set(null);
  }

  setReason(reason: string): void {
    this.adjustmentReason = reason;
  }

  isAdjustmentValid(): boolean {
    const prod = this.adjustingProduct();
    if (!prod) return false;
    if (!this.adjustmentQuantityChange || this.adjustmentQuantityChange === 0) return false;
    if ((prod.currentStock + this.adjustmentQuantityChange) < 0) return false;
    return !!this.adjustmentReason.trim();
  }

  submitStockAdjustment(): void {
    const prod = this.adjustingProduct();
    if (!prod || !this.isAdjustmentValid()) return;

    this.adjustmentLoading.set(true);
    this.adjustmentFeedback.set(null);

    this.inventoryService
      .adjustStock({
        productId: prod.id,
        quantityChange: Number(this.adjustmentQuantityChange),
        reason: this.adjustmentReason.trim(),
      })
      .subscribe({
        next: () => {
          this.adjustmentLoading.set(false);
          this.closeAdjustmentDialog();
          this.refresh();
        },
        error: (err) => {
          this.adjustmentLoading.set(false);
          const detail = err?.error?.detail ?? err?.error?.message ?? 'Failed to adjust stock';
          this.adjustmentFeedback.set(detail);
        },
      });
  }
}
