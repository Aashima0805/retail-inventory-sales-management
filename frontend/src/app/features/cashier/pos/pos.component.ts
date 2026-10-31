import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { HttpErrorResponse } from '@angular/common/http';
import { PosService } from '../../../core/services/pos.service';
import { AdminService } from '../../../core/services/admin.service';
import { Product, Category, SaleResponse } from '../../../core/models/admin.models';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="pos-layout no-print">
      <!-- LEFT PANEL: PRODUCT CATALOG SEARCH -->
      <div class="catalog-panel">
        <div class="panel-header">
          <h1>Point of Sale</h1>
          <p>Search active catalog products and add items to checkout cart.</p>
        </div>

        <!-- Search Bar -->
        <div class="search-bar">
          <mat-form-field appearance="outline" density="compact" class="search-input">
            <mat-label>Search Product Name or SKU</mat-label>
            <input
              matInput
              [(ngModel)]="searchKeyword"
              (keyup.enter)="loadProducts()"
              placeholder="e.g. BEV-001 or Water"
            />
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" density="compact" class="category-select">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="selectedCategory" (selectionChange)="loadProducts()">
              <mat-option [value]="null">All Categories</mat-option>
              @for (cat of categories(); track cat.id) {
                <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <button mat-flat-button color="primary" (click)="loadProducts()">Search</button>
        </div>

        @if (catalogLoading()) {
          <mat-progress-bar mode="indeterminate" class="mb-3"></mat-progress-bar>
        }

        <!-- Product Cards Grid -->
        <div class="product-grid">
          @if (products().length === 0 && !catalogLoading()) {
            <div class="no-products">
              <mat-icon class="large-icon">search_off</mat-icon>
              <p>No active products match your search.</p>
            </div>
          }
          @for (p of products(); track p.id) {
            <mat-card class="product-card" [class.out-of-stock]="p.currentStock <= 0">
              <mat-card-header>
                <div class="product-title-row">
                  <span class="product-name">{{ p.name }}</span>
                  <span class="product-price">₹{{ p.price | number:'1.2-2' }}</span>
                </div>
                <div class="product-sub-row">
                  <code>{{ p.sku }}</code>
                  <span class="category-tag">{{ p.category.name }}</span>
                </div>
              </mat-card-header>

              <mat-card-content>
                <div class="stock-info">
                  @if (p.currentStock > 0) {
                    <span class="stock-badge in-stock">
                      <mat-icon class="stock-icon">inventory</mat-icon>
                      {{ p.currentStock }} in stock
                    </span>
                  } @else {
                    <span class="stock-badge out-stock">
                      <mat-icon class="stock-icon">block</mat-icon>
                      Out of stock
                    </span>
                  }
                </div>
              </mat-card-content>

              <mat-card-actions align="end">
                <button
                  mat-raised-button
                  color="primary"
                  [disabled]="p.currentStock <= 0"
                  (click)="addItem(p)"
                >
                  <mat-icon>add_shopping_cart</mat-icon> Add
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      </div>

      <!-- RIGHT PANEL: SHOPPING CART & CHECKOUT -->
      <div class="cart-panel">
        <mat-card class="cart-card">
          <mat-card-header class="cart-header">
            <div class="cart-title">
              <mat-icon color="primary">shopping_cart</mat-icon>
              <h2>Current Sale Cart</h2>
            </div>
            <span class="items-count-badge">{{ cartTotalQuantity() }} item(s)</span>
          </mat-card-header>

          <mat-divider></mat-divider>

          @if (errorMessage()) {
            <div class="alert-banner error" role="alert">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <mat-card-content class="cart-items-container">
            @if (cart().length === 0) {
              <div class="empty-cart-state">
                <mat-icon class="empty-cart-icon">shopping_cart_checkout</mat-icon>
                <p>The cart is currently empty.</p>
                <small>Select products from the left to start this sale.</small>
              </div>
            } @else {
              <div class="cart-items-list">
                @for (item of cart(); track item.product.id) {
                  <div class="cart-item-row">
                    <div class="item-meta">
                      <strong>{{ item.product.name }}</strong>
                      <div class="item-sub">
                        <code>{{ item.product.sku }}</code>
                        <span>₹{{ item.product.price | number:'1.2-2' }} each</span>
                      </div>
                    </div>

                    <div class="qty-control">
                      <button
                        mat-icon-button
                        class="qty-btn"
                        (click)="decrementItem(item.product.id, item.quantity)"
                        [disabled]="checkoutLoading()"
                      >
                        <mat-icon>remove</mat-icon>
                      </button>
                      <span class="qty-val">{{ item.quantity }}</span>
                      <button
                        mat-icon-button
                        class="qty-btn"
                        (click)="incrementItem(item.product, item.quantity)"
                        [disabled]="checkoutLoading() || item.quantity >= item.product.currentStock"
                      >
                        <mat-icon>add</mat-icon>
                      </button>
                    </div>

                    <div class="item-total">
                      <span>₹{{ item.lineTotal | number:'1.2-2' }}</span>
                      <button
                        mat-icon-button
                        color="warn"
                        class="delete-btn"
                        (click)="removeItem(item.product.id)"
                        [disabled]="checkoutLoading()"
                        title="Remove item"
                      >
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </mat-card-content>

          <mat-divider></mat-divider>

          <!-- Cart Summary & Actions -->
          <div class="cart-footer">
            <div class="summary-line">
              <span class="summary-label">Items Count:</span>
              <span class="summary-val">{{ cartTotalQuantity() }}</span>
            </div>
            <div class="summary-line grand-total-line">
              <span class="summary-label">Total Amount:</span>
              <span class="grand-total">₹{{ cartGrandTotal() | number:'1.2-2' }}</span>
            </div>

            <div class="action-buttons">
              <button
                mat-stroked-button
                color="warn"
                [disabled]="cart().length === 0 || checkoutLoading()"
                (click)="clearCart()"
              >
                Clear Cart
              </button>

              <button
                mat-raised-button
                color="primary"
                class="checkout-btn"
                [disabled]="cart().length === 0 || checkoutLoading()"
                (click)="performCheckout()"
              >
                @if (checkoutLoading()) {
                  <span>Processing Checkout…</span>
                } @else {
                  <mat-icon>receipt</mat-icon>
                  <span>Complete Checkout (₹{{ cartGrandTotal() | number:'1.2-2' }})</span>
                }
              </button>
            </div>
          </div>
        </mat-card>
      </div>
    </div>

    <!-- COMPLETED SALE RECEIPT MODAL -->
    @if (completedSale()) {
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
                <div><strong>Receipt #:</strong> {{ completedSale()?.receiptNumber }}</div>
                <div><strong>Date:</strong> {{ completedSale()?.saleDate | date:'medium' }}</div>
                <div><strong>Cashier:</strong> {{ completedSale()?.cashierFullName }} ({{ completedSale()?.cashierUsername }})</div>
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
                @for (item of completedSale()?.items; track item.id) {
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
                <span>Total Items Sold:</span>
                <strong>{{ completedSale()?.items?.length ?? 0 }}</strong>
              </div>
              <div class="receipt-total-row grand">
                <span>Grand Total:</span>
                <strong>₹{{ completedSale()?.totalAmount | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div class="receipt-footer">
              <p>Thank you for shopping with us!</p>
              <small>Please retain this receipt for returns or exchanges.</small>
            </div>
          </div>

          <!-- Modal Action Buttons (Hidden when printing) -->
          <div class="modal-buttons no-print">
            <button mat-flat-button color="primary" (click)="printReceipt()">
              <mat-icon>print</mat-icon> Print Receipt
            </button>
            <button mat-stroked-button (click)="closeReceipt()">
              <mat-icon>add</mat-icon> Start New Sale
            </button>
          </div>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .pos-layout {
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 1.5rem;
      min-height: calc(100vh - 120px);
    }
    @media (max-width: 992px) {
      .pos-layout {
        grid-template-columns: 1fr;
      }
    }
    .panel-header h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a237e;
    }
    .panel-header p {
      color: #64748b;
      margin: 0 0 1rem;
    }
    .search-bar {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .search-input {
      flex: 2;
      min-width: 200px;
    }
    .category-select {
      flex: 1;
      min-width: 150px;
    }
    .mb-3 { margin-bottom: 1rem; }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
      max-height: calc(100vh - 250px);
      overflow-y: auto;
      padding-right: 4px;
    }
    .product-card {
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .product-card.out-of-stock {
      opacity: 0.6;
      background: #fafafa;
    }
    .product-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
      margin-bottom: 4px;
    }
    .product-name {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }
    .product-price {
      font-size: 1.1rem;
      font-weight: 700;
      color: #16a34a;
    }
    .product-sub-row {
      display: flex;
      justify-content: space-between;
      width: 100%;
      font-size: 0.8rem;
    }
    .category-tag {
      background: #f1f5f9;
      color: #475569;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .stock-info {
      margin-top: 8px;
    }
    .stock-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .stock-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .in-stock { background: #dcfce7; color: #15803d; }
    .out-stock { background: #fee2e2; color: #b91c1c; }
    .no-products {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem 1rem;
      color: #94a3b8;
    }
    .large-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 0.5rem;
    }
    .cart-card {
      border-radius: 12px;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    }
    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
    }
    .cart-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cart-title h2 {
      margin: 0;
      font-size: 1.2rem;
      color: #1a237e;
    }
    .items-count-badge {
      background: #e0e7ff;
      color: #3730a3;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .cart-items-container {
      flex: 1;
      overflow-y: auto;
      max-height: calc(100vh - 380px);
      padding: 0.75rem 1rem;
    }
    .empty-cart-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #94a3b8;
    }
    .empty-cart-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #cbd5e1;
    }
    .cart-items-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .cart-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .item-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .item-meta strong {
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-sub {
      font-size: 0.75rem;
      color: #64748b;
      display: flex;
      gap: 8px;
      margin-top: 2px;
    }
    .qty-control {
      display: flex;
      align-items: center;
      gap: 2px;
      margin: 0 8px;
    }
    .qty-btn {
      width: 28px;
      height: 28px;
      line-height: 28px;
    }
    .qty-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .qty-val {
      font-weight: 700;
      min-width: 24px;
      text-align: center;
      font-size: 0.9rem;
    }
    .item-total {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 700;
      color: #1e293b;
      font-size: 0.95rem;
    }
    .delete-btn {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }
    .delete-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .cart-footer {
      padding: 1rem 1.25rem;
      background: #f8fafc;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 0.9rem;
      color: #475569;
    }
    .grand-total-line {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #cbd5e1;
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
    }
    .grand-total {
      font-size: 1.4rem;
      color: #16a34a;
    }
    .action-buttons {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .checkout-btn {
      flex: 1;
      height: 48px;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      margin: 10px;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    .alert-banner.error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
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
export class PosComponent implements OnInit {
  private readonly posService = inject(PosService);
  private readonly adminService = inject(AdminService);

  readonly cart = this.posService.cart;
  readonly cartTotalQuantity = this.posService.cartTotalQuantity;
  readonly cartGrandTotal = this.posService.cartGrandTotal;

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly catalogLoading = signal(false);
  readonly checkoutLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly completedSale = signal<SaleResponse | null>(null);

  searchKeyword = '';
  selectedCategory: number | null = null;

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.adminService.getCategories(0, 100).subscribe({
      next: (res) => this.categories.set(res.content ?? []),
      error: () => {},
    });
  }

  loadProducts(): void {
    this.catalogLoading.set(true);
    this.posService.searchProducts(this.searchKeyword, this.selectedCategory ?? undefined).subscribe({
      next: (res) => {
        this.products.set(res.content ?? []);
        this.catalogLoading.set(false);
      },
      error: () => this.catalogLoading.set(false),
    });
  }

  addItem(product: Product): void {
    this.errorMessage.set(null);
    const result = this.posService.addToCart(product, 1);
    if (!result.success) {
      this.errorMessage.set(result.message ?? 'Cannot add item to cart');
    }
  }

  incrementItem(product: Product, currentQty: number): void {
    this.errorMessage.set(null);
    const result = this.posService.updateQuantity(product.id, currentQty + 1);
    if (!result.success) {
      this.errorMessage.set(result.message ?? 'Cannot increase quantity');
    }
  }

  decrementItem(productId: number, currentQty: number): void {
    this.errorMessage.set(null);
    this.posService.updateQuantity(productId, currentQty - 1);
  }

  removeItem(productId: number): void {
    this.posService.removeFromCart(productId);
  }

  clearCart(): void {
    this.errorMessage.set(null);
    this.posService.clearCart();
  }

  performCheckout(): void {
    if (this.cart().length === 0 || this.checkoutLoading()) {
      return;
    }

    this.checkoutLoading.set(true);
    this.errorMessage.set(null);

    this.posService.checkout().subscribe({
      next: (sale) => {
        this.checkoutLoading.set(false);
        this.completedSale.set(sale);
        this.loadProducts(); // refresh available product stock in catalog
      },
      error: (err: unknown) => {
        this.checkoutLoading.set(false);
        const httpErr = err as HttpErrorResponse;
        if (httpErr.status === 409) {
          this.errorMessage.set('Stock conflict or concurrent sale detected. Please re-check item availability.');
        } else if (httpErr.status === 400) {
          const detail = httpErr.error?.detail ?? (httpErr.error?.message || 'Sale request was rejected by server.');
          this.errorMessage.set(detail);
        } else {
          this.errorMessage.set('Failed to complete sale checkout. Please try again.');
        }
      },
    });
  }

  printReceipt(): void {
    window.print();
  }

  closeReceipt(): void {
    this.completedSale.set(null);
  }
}
