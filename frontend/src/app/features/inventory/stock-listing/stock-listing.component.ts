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
                    <button
                      mat-button
                      color="primary"
                      routerLink="/inventory/receive"
                      [queryParams]="{ productId: product.id, supplierId: null }"
                      class="receive-btn"
                    >
                      <mat-icon>add_circle_outline</mat-icon> Receive
                    </button>
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
}
