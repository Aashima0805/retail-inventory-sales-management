import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { InventoryService, StockReceiptRequest, StockReceiptItemRequest } from '../../../core/services/inventory.service';
import { Product, Supplier, StockReceiptResponse } from '../../../core/models/admin.models';

interface ReceiptDraftItem {
  productId: number | null;
  quantityReceived: number;
  unitCost: number;
}

@Component({
  selector: 'app-receive-stock',
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
          <h1>Receive Incoming Stock</h1>
          <p>Record shipment deliveries from suppliers and automatically update inventory balances.</p>
        </div>
        <div class="header-actions">
          <button mat-stroked-button routerLink="/inventory/receipts">
            <mat-icon>history</mat-icon> Receipt History
          </button>
        </div>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-3"></mat-progress-bar>
      }

      @if (errorMessage()) {
        <div class="feedback-banner error">
          <mat-icon>error</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <!-- RECEIPT ENTRY FORM -->
      <mat-card class="form-card">
        <form (ngSubmit)="submitReceipt()">
          <!-- Supplier Selection & General Details -->
          <div class="form-row">
            <mat-form-field appearance="outline" class="flex-2">
              <mat-label>Supplier *</mat-label>
              <mat-select [(ngModel)]="selectedSupplierId" name="supplierId" required>
                <mat-option [value]="null">Select a supplier</mat-option>
                @for (s of suppliers(); track s.id) {
                  <mat-option [value]="s.id">
                    {{ s.name }}
                    @if (s.contactPerson) {
                      ({{ s.contactPerson }})
                    }
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-3">
              <mat-label>Delivery / Invoice Notes (Optional)</mat-label>
              <input
                matInput
                [(ngModel)]="notes"
                name="notes"
                placeholder="e.g. PO-8492, Delivered by carrier ABC"
                maxlength="255"
              />
            </mat-form-field>
          </div>

          <mat-divider class="my-3"></mat-divider>

          <!-- Items Table Section -->
          <div class="items-section-header">
            <h3>Shipment Items</h3>
            <button type="button" mat-stroked-button color="primary" (click)="addItem()">
              <mat-icon>add</mat-icon> Add Another Product
            </button>
          </div>

          <div class="items-table-wrap">
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40%;">Product *</th>
                  <th style="width: 20%; text-align: right;">Quantity Received *</th>
                  <th style="width: 20%; text-align: right;">Unit Cost (₹) *</th>
                  <th style="width: 15%; text-align: right;">Line Total</th>
                  <th style="width: 5%; text-align: center;"></th>
                </tr>
              </thead>
              <tbody>
                @for (item of items; track $index) {
                  <tr>
                    <td>
                      <mat-form-field appearance="outline" density="compact" class="w-100">
                        <mat-select [(ngModel)]="item.productId" [name]="'prod_' + $index" required>
                          <mat-option [value]="null">Select product</mat-option>
                          @for (p of products(); track p.id) {
                            <mat-option [value]="p.id">
                              {{ p.name }} ({{ p.sku }}) — Current: {{ p.currentStock }}
                            </mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </td>
                    <td>
                      <mat-form-field appearance="outline" density="compact" class="w-100 text-right-input">
                        <input
                          matInput
                          type="number"
                          [(ngModel)]="item.quantityReceived"
                          [name]="'qty_' + $index"
                          min="1"
                          required
                        />
                      </mat-form-field>
                    </td>
                    <td>
                      <mat-form-field appearance="outline" density="compact" class="w-100 text-right-input">
                        <input
                          matInput
                          type="number"
                          step="0.01"
                          [(ngModel)]="item.unitCost"
                          [name]="'cost_' + $index"
                          min="0.01"
                          required
                        />
                      </mat-form-field>
                    </td>
                    <td style="text-align: right; vertical-align: middle; font-weight: 600;">
                      ₹{{ (item.quantityReceived * item.unitCost) | number:'1.2-2' }}
                    </td>
                    <td style="text-align: center; vertical-align: middle;">
                      <button
                        type="button"
                        mat-icon-button
                        color="warn"
                        (click)="removeItem($index)"
                        [disabled]="items.length <= 1"
                        title="Remove item"
                      >
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Total Summary & Submit -->
          <div class="summary-and-actions">
            <div class="totals-box">
              <div class="totals-row">
                <span>Total Items:</span>
                <strong>{{ items.length }}</strong>
              </div>
              <div class="totals-row">
                <span>Total Quantity:</span>
                <strong>{{ calculateTotalQuantity() }}</strong>
              </div>
              <div class="totals-row total-amount">
                <span>Total Value:</span>
                <strong>₹{{ calculateTotalCost() | number:'1.2-2' }}</strong>
              </div>
            </div>

            <div class="actions-row">
              <button type="button" mat-button routerLink="/inventory/dashboard">Cancel</button>
              <button
                type="submit"
                mat-raised-button
                color="primary"
                [disabled]="submitting() || !isFormValid()"
                class="submit-btn"
              >
                <mat-icon>check_circle</mat-icon> Confirm & Receive Stock
              </button>
            </div>
          </div>
        </form>
      </mat-card>

      <!-- RECEIPT CONFIRMATION MODAL -->
      @if (confirmedReceipt(); as receipt) {
        <div class="modal-backdrop">
          <mat-card class="confirmation-dialog">
            <div class="dialog-header">
              <div class="success-icon-box">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div>
                <h2>Stock Receipt Confirmed</h2>
                <p>Shipment successfully recorded and product stock levels updated.</p>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="receipt-details">
              <div class="receipt-highlight">
                <span class="ref-label">Generated Receipt Number</span>
                <span class="ref-number">{{ receipt.receiptReference }}</span>
              </div>

              <div class="detail-grid">
                <div>
                  <span class="detail-label">Supplier:</span>
                  <strong>{{ receipt.supplierName }}</strong>
                </div>
                <div>
                  <span class="detail-label">Received Date:</span>
                  <strong>{{ receipt.receivedDate | date:'medium' }}</strong>
                </div>
                <div>
                  <span class="detail-label">Received By:</span>
                  <strong>{{ receipt.receivedByUsername }}</strong>
                </div>
                <div>
                  <span class="detail-label">Total Quantity:</span>
                  <strong>{{ receipt.totalQuantityReceived }} units</strong>
                </div>
                @if (receipt.notes) {
                  <div class="grid-span-2">
                    <span class="detail-label">Notes:</span>
                    <span>{{ receipt.notes }}</span>
                  </div>
                }
              </div>

              <div class="items-summary-wrap">
                <h4>Received Line Items:</h4>
                <table class="receipt-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th style="text-align: right;">Quantity</th>
                      <th style="text-align: right;">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of receipt.items; track item.id) {
                      <tr>
                        <td>{{ item.productName }}</td>
                        <td><code>{{ item.productSku }}</code></td>
                        <td style="text-align: right; font-weight: 600;">+{{ item.quantityReceived }}</td>
                        <td style="text-align: right;">₹{{ item.unitCost | number:'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="dialog-footer">
              <button mat-stroked-button (click)="closeConfirmationAndReset()">
                <mat-icon>add_box</mat-icon> Receive Another Delivery
              </button>
              <button mat-flat-button color="primary" routerLink="/inventory/receipts">
                <mat-icon>receipt_long</mat-icon> View Receipt History
              </button>
            </div>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1100px;
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
    .form-card {
      border-radius: 12px;
      padding: 1.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      background: white;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .flex-2 {
      flex: 2;
      min-width: 260px;
    }
    .flex-3 {
      flex: 3;
      min-width: 280px;
    }
    .items-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 1rem 0 0.75rem;
    }
    .items-section-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #1e293b;
    }
    .items-table-wrap {
      overflow-x: auto;
      margin-bottom: 1.5rem;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.85rem;
    }
    .items-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
    }
    .w-100 {
      width: 100%;
    }
    .text-right-input input {
      text-align: right;
    }
    .summary-and-actions {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .totals-box {
      background: #f8fafc;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      min-width: 240px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 4px;
      font-size: 0.9rem;
      color: #475569;
    }
    .total-amount {
      font-size: 1.05rem;
      font-weight: 700;
      color: #1a237e;
      border-top: 1px dashed #cbd5e1;
      padding-top: 6px;
      margin-top: 6px;
    }
    .actions-row {
      display: flex;
      gap: 1rem;
    }
    .submit-btn {
      padding: 0 1.5rem;
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
    .my-3 {
      margin: 1rem 0;
    }
    .mb-3 {
      margin-bottom: 0.75rem;
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
    .confirmation-dialog {
      max-width: 650px;
      width: 100%;
      border-radius: 12px;
      padding: 1.5rem;
      background: white;
      max-height: 90vh;
      overflow-y: auto;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .success-icon-box mat-icon {
      font-size: 44px;
      width: 44px;
      height: 44px;
      color: #2e7d32;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 1.35rem;
      color: #1e293b;
    }
    .dialog-header p {
      margin: 2px 0 0;
      color: #64748b;
      font-size: 0.85rem;
    }
    .receipt-details {
      padding: 1.25rem 0;
    }
    .receipt-highlight {
      background: #e8eaf6;
      border: 1px solid #c5cae9;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      margin-bottom: 1.25rem;
    }
    .ref-label {
      display: block;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #3949ab;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .ref-number {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1a237e;
      letter-spacing: 1px;
      font-family: monospace;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem 1rem;
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
    }
    .grid-span-2 {
      grid-column: span 2;
    }
    .detail-label {
      color: #64748b;
      margin-right: 6px;
    }
    .items-summary-wrap h4 {
      margin: 0 0 0.5rem;
      font-size: 0.95rem;
      color: #334155;
    }
    .receipt-items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .receipt-items-table th {
      background: #f1f5f9;
      color: #475569;
      padding: 6px 8px;
      border-bottom: 1px solid #cbd5e1;
    }
    .receipt-items-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }
  `],
})
export class ReceiveStockComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly suppliers = signal<Supplier[]>([]);
  readonly products = signal<Product[]>([]);
  readonly confirmedReceipt = signal<StockReceiptResponse | null>(null);

  selectedSupplierId: number | null = null;
  notes = '';
  items: ReceiptDraftItem[] = [
    { productId: null, quantityReceived: 1, unitCost: 10.0 },
  ];

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadProducts();

    // Check optional query param
    this.route.queryParams.subscribe((params) => {
      if (params['productId']) {
        const pId = Number(params['productId']);
        if (pId && !isNaN(pId)) {
          this.items[0].productId = pId;
        }
      }
    });
  }

  loadSuppliers(): void {
    this.inventoryService.getActiveSuppliers().subscribe({
      next: (res) => this.suppliers.set(res.content ?? []),
      error: () => this.errorMessage.set('Failed to load active suppliers.'),
    });
  }

  loadProducts(): void {
    this.inventoryService.getActiveProducts().subscribe({
      next: (res) => this.products.set(res.content ?? []),
      error: () => this.errorMessage.set('Failed to load products list.'),
    });
  }

  addItem(): void {
    this.items.push({ productId: null, quantityReceived: 1, unitCost: 10.0 });
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }
  }

  calculateTotalQuantity(): number {
    return this.items.reduce((sum, item) => sum + (Number(item.quantityReceived) || 0), 0);
  }

  calculateTotalCost(): number {
    return this.items.reduce(
      (sum, item) => sum + (Number(item.quantityReceived) || 0) * (Number(item.unitCost) || 0),
      0
    );
  }

  isFormValid(): boolean {
    if (!this.selectedSupplierId) return false;
    if (this.items.length === 0) return false;
    return this.items.every(
      (i) => i.productId !== null && i.quantityReceived > 0 && i.unitCost > 0
    );
  }

  submitReceipt(): void {
    if (!this.isFormValid()) return;

    this.submitting.set(true);
    this.errorMessage.set('');

    const payload: StockReceiptRequest = {
      supplierId: this.selectedSupplierId!,
      notes: this.notes.trim() || undefined,
      items: this.items.map((i) => ({
        productId: i.productId!,
        quantityReceived: Number(i.quantityReceived),
        unitCost: Number(i.unitCost),
      })),
    };

    this.inventoryService.recordIncomingStock(payload).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.confirmedReceipt.set(response);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg =
          err?.error?.message ??
          err?.error?.detail ??
          'Failed to record stock receipt. Please verify input.';
        this.errorMessage.set(msg);
      },
    });
  }

  closeConfirmationAndReset(): void {
    this.confirmedReceipt.set(null);
    this.selectedSupplierId = null;
    this.notes = '';
    this.items = [{ productId: null, quantityReceived: 1, unitCost: 10.0 }];
    this.errorMessage.set('');
  }
}
