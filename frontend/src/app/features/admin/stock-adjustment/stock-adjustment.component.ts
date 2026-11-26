import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { InventoryService } from '../../../core/services/inventory.service';
import { AdminService } from '../../../core/services/admin.service';
import { Product, StockAdjustmentRequest, StockAdjustmentResponse } from '../../../core/models/admin.models';

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <div>
          <h1>Stock Adjustment</h1>
          <p>Manually correct inventory levels due to damage, theft, audit discrepancies, or other reasons.</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button routerLink="/inventory/stock">
            <mat-icon>inventory_2</mat-icon> View Stock Levels
          </button>
        </div>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-3"></mat-progress-bar>
      }

      <!-- ADJUSTMENT HISTORY TABLE -->
      <mat-card class="form-card">
        <h2 class="section-heading">
          <mat-icon class="heading-icon">tune</mat-icon> New Stock Adjustment
        </h2>
        <mat-divider class="mb-3"></mat-divider>

        @if (errorMessage()) {
          <div class="feedback-banner error">
            <mat-icon>error</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form (ngSubmit)="submitAdjustment()">
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex-3">
              <mat-label>Product *</mat-label>
              <mat-select [(ngModel)]="selectedProductId" name="productId" required (selectionChange)="onProductChange()">
                <mat-option [value]="null">Select a product</mat-option>
                @for (p of products(); track p.id) {
                  <mat-option [value]="p.id">
                    {{ p.name }} <span class="sku-hint">({{ p.sku }}) — Stock: {{ p.currentStock }}</span>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Adjustment Type *</mat-label>
              <mat-select [(ngModel)]="adjustmentType" name="adjustmentType" required>
                <mat-option value="add">Add Stock (+)</mat-option>
                <mat-option value="remove">Remove Stock (−)</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Quantity *</mat-label>
              <input
                matInput
                type="number"
                [(ngModel)]="adjustmentQty"
                name="quantity"
                min="1"
                required
              />
            </mat-form-field>
          </div>

          <!-- Current Stock Preview -->
          @if (selectedProduct()) {
            <div class="stock-preview">
              <div class="preview-row">
                <span>Current Stock:</span>
                <strong>{{ selectedProduct()!.currentStock }}</strong>
              </div>
              <div class="preview-row">
                <span>After Adjustment:</span>
                <strong [class.text-danger]="getNewStock() < 0" [class.text-success]="getNewStock() >= 0">
                  {{ getNewStock() }}
                  @if (getNewStock() < 0) { <small> ⚠ Cannot go below 0</small> }
                </strong>
              </div>
            </div>
          }

          <mat-form-field appearance="outline" class="full-width mt-2">
            <mat-label>Reason / Notes *</mat-label>
            <textarea
              matInput
              [(ngModel)]="reason"
              name="reason"
              rows="2"
              required
              maxlength="500"
              placeholder="e.g. Physical count discrepancy, damaged goods, theft, audit correction"
            ></textarea>
          </mat-form-field>

          <div class="form-actions">
            <button type="button" mat-stroked-button routerLink="/admin/dashboard">Cancel</button>
            <button
              type="submit"
              mat-raised-button
              color="primary"
              [disabled]="submitting() || !isFormValid()"
            >
              <mat-icon>check_circle</mat-icon> Apply Adjustment
            </button>
          </div>
        </form>
      </mat-card>

      <!-- RECENT ADJUSTMENTS -->
      @if (recentAdjustments().length > 0) {
        <mat-card class="history-card">
          <h2 class="section-heading">
            <mat-icon class="heading-icon">history</mat-icon> Recent Adjustments (This Session)
          </h2>
          <mat-divider class="mb-3"></mat-divider>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th style="text-align: right;">Change</th>
                  <th style="text-align: right;">Before</th>
                  <th style="text-align: right;">After</th>
                  <th>Reason</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                @for (adj of recentAdjustments(); track adj.id) {
                  <tr>
                    <td><strong>{{ adj.productName }}</strong></td>
                    <td><code>{{ adj.productSku }}</code></td>
                    <td style="text-align: right;">
                      <span [class]="adj.quantityChange > 0 ? 'badge badge-success' : 'badge badge-danger'">
                        {{ adj.quantityChange > 0 ? '+' : '' }}{{ adj.quantityChange }}
                      </span>
                    </td>
                    <td style="text-align: right;">{{ adj.previousStock }}</td>
                    <td style="text-align: right;"><strong>{{ adj.newStock }}</strong></td>
                    <td class="reason-col">{{ adj.reason }}</td>
                    <td>{{ adj.performedByUsername }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mat-card>
      }
    </div>

    <!-- SUCCESS MODAL -->
    @if (lastResult()) {
      <div class="modal-backdrop">
        <mat-card class="success-modal">
          <div class="modal-icon-row">
            <mat-icon class="success-icon">check_circle</mat-icon>
          </div>
          <h2>Adjustment Applied</h2>
          <p>Stock level for <strong>{{ lastResult()!.productName }}</strong> has been updated.</p>

          <div class="result-grid">
            <div>
              <span class="result-label">SKU:</span>
              <code>{{ lastResult()!.productSku }}</code>
            </div>
            <div>
              <span class="result-label">Change:</span>
              <strong [class]="lastResult()!.quantityChange > 0 ? 'text-success' : 'text-danger'">
                {{ lastResult()!.quantityChange > 0 ? '+' : '' }}{{ lastResult()!.quantityChange }}
              </strong>
            </div>
            <div>
              <span class="result-label">Before:</span>
              <strong>{{ lastResult()!.previousStock }}</strong>
            </div>
            <div>
              <span class="result-label">After:</span>
              <strong>{{ lastResult()!.newStock }}</strong>
            </div>
          </div>

          <div class="modal-actions">
            <button mat-flat-button color="primary" (click)="closeModal()">
              <mat-icon>add</mat-icon> Make Another Adjustment
            </button>
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
    .form-card, .history-card {
      border-radius: 12px;
      padding: 1.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      background: white;
      margin-bottom: 1.5rem;
    }
    .section-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      color: #1e293b;
    }
    .heading-icon {
      color: #3949ab;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .mb-3 { margin-bottom: 0.75rem; }
    .mt-2 { margin-top: 0.5rem; }
    .form-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }
    .flex-1 { flex: 1; min-width: 160px; }
    .flex-3 { flex: 3; min-width: 260px; }
    .full-width { width: 100%; }
    .sku-hint { color: #64748b; font-size: 0.85em; }
    .stock-preview {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      display: flex;
      gap: 2rem;
    }
    .preview-row {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 0.9rem;
      color: #334155;
    }
    .text-success { color: #16a34a; }
    .text-danger { color: #dc2626; }
    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;
    }
    .feedback-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .feedback-banner.error {
      background: #ffebee;
      color: #c62828;
    }
    .table-wrap { overflow-x: auto; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
      padding: 10px 12px;
      border-bottom: 2px solid #e2e8f0;
      text-align: left;
    }
    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .badge-success { background: #dcfce7; color: #16a34a; }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    .reason-col {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #64748b;
      font-size: 0.85rem;
    }

    /* SUCCESS MODAL */
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
    .success-modal {
      max-width: 420px;
      width: 100%;
      border-radius: 12px;
      padding: 2rem 1.75rem;
      background: white;
      text-align: center;
    }
    .modal-icon-row {
      margin-bottom: 0.75rem;
    }
    .success-icon {
      font-size: 52px;
      width: 52px;
      height: 52px;
      color: #16a34a;
    }
    .success-modal h2 {
      margin: 0 0 0.5rem;
      font-size: 1.35rem;
      color: #1e293b;
    }
    .success-modal p {
      color: #64748b;
      margin: 0 0 1.25rem;
      font-size: 0.9rem;
    }
    .result-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem 1rem;
      text-align: left;
      background: #f8fafc;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    .result-label {
      color: #64748b;
      margin-right: 4px;
    }
    .modal-actions {
      display: flex;
      justify-content: center;
    }
  `],
})
export class StockAdjustmentComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly adminService = inject(AdminService);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly products = signal<Product[]>([]);
  readonly selectedProduct = signal<Product | null>(null);
  readonly lastResult = signal<StockAdjustmentResponse | null>(null);
  readonly recentAdjustments = signal<StockAdjustmentResponse[]>([]);

  selectedProductId: number | null = null;
  adjustmentType: 'add' | 'remove' = 'add';
  adjustmentQty = 1;
  reason = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.adminService.getProducts({ isActive: true, page: 0, size: 500 }).subscribe({
      next: (res) => {
        this.products.set(res.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Failed to load products.');
      },
    });
  }

  onProductChange(): void {
    const p = this.products().find((x) => x.id === this.selectedProductId) ?? null;
    this.selectedProduct.set(p);
  }

  getNewStock(): number {
    const p = this.selectedProduct();
    if (!p) return 0;
    const delta = Number(this.adjustmentQty) || 0;
    return this.adjustmentType === 'add' ? p.currentStock + delta : p.currentStock - delta;
  }

  isFormValid(): boolean {
    return (
      !!this.selectedProductId &&
      !!this.adjustmentType &&
      Number(this.adjustmentQty) > 0 &&
      this.reason.trim().length > 2 &&
      this.getNewStock() >= 0
    );
  }

  submitAdjustment(): void {
    if (!this.isFormValid()) return;

    this.submitting.set(true);
    this.errorMessage.set('');

    const delta = Number(this.adjustmentQty);
    const quantityChange = this.adjustmentType === 'add' ? delta : -delta;

    const payload: StockAdjustmentRequest = {
      productId: this.selectedProductId!,
      quantityChange,
      reason: this.reason.trim(),
    };

    this.inventoryService.adjustStock(payload).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.lastResult.set(result);
        this.recentAdjustments.update((list) => [result, ...list]);
        // Update local product stock
        this.products.update((list) =>
          list.map((p) => (p.id === result.productId ? { ...p, currentStock: result.newStock } : p))
        );
        // Reset form
        this.selectedProductId = null;
        this.selectedProduct.set(null);
        this.adjustmentQty = 1;
        this.adjustmentType = 'add';
        this.reason = '';
      },
      error: (err) => {
        this.submitting.set(false);
        const msg =
          err?.error?.message ??
          err?.error?.detail ??
          'Failed to apply stock adjustment. Please try again.';
        this.errorMessage.set(msg);
      },
    });
  }

  closeModal(): void {
    this.lastResult.set(null);
  }
}
