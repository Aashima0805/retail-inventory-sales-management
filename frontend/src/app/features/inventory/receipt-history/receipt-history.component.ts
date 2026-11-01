import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { InventoryService } from '../../../core/services/inventory.service';
import { StockReceiptResponse } from '../../../core/models/admin.models';

@Component({
  selector: 'app-receipt-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <div>
          <h1>Stock Receipt History</h1>
          <p>Audit trail of all incoming stock receipts, deliveries and supplier records.</p>
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

      <mat-card class="content-card">
        <!-- Date Filters Bar -->
        <div class="toolbar">
          <mat-form-field appearance="outline" density="compact">
            <mat-label>Start Date</mat-label>
            <input matInput type="date" [(ngModel)]="startDate" />
          </mat-form-field>

          <mat-form-field appearance="outline" density="compact">
            <mat-label>End Date</mat-label>
            <input matInput type="date" [(ngModel)]="endDate" />
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="applyFilters()">
            <mat-icon>filter_list</mat-icon> Apply Filter
          </button>

          <button mat-stroked-button (click)="resetFilters()" [disabled]="!startDate && !endDate">
            <mat-icon>clear</mat-icon> Reset
          </button>

          <span class="spacer"></span>

          <button mat-icon-button (click)="loadReceipts(currentPage())" title="Refresh">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>

        <!-- History Table -->
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date & Time</th>
                <th>Supplier</th>
                <th>Received By</th>
                <th style="text-align: right;">Total Units</th>
                <th>Notes</th>
                <th style="text-align: center; width: 100px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (receipts().length === 0 && !loading()) {
                <tr>
                  <td colspan="7" class="text-center py-4">No stock receipt records found.</td>
                </tr>
              }
              @for (receipt of receipts(); track receipt.id) {
                <tr>
                  <td><code>{{ receipt.receiptReference }}</code></td>
                  <td>{{ receipt.receivedDate | date:'medium' }}</td>
                  <td><strong>{{ receipt.supplierName }}</strong></td>
                  <td>{{ receipt.receivedByUsername }}</td>
                  <td style="text-align: right;">
                    <span class="units-badge">{{ receipt.totalQuantityReceived }} units</span>
                  </td>
                  <td class="notes-col">{{ receipt.notes || '—' }}</td>
                  <td style="text-align: center;">
                    <button mat-icon-button color="primary" (click)="viewDetails(receipt)" title="View Receipt Details">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination-bar">
            <span>Page {{ currentPage() + 1 }} of {{ totalPages() }} ({{ totalElements() }} total receipts)</span>
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

      <!-- DETAIL VIEW MODAL -->
      @if (selectedReceipt(); as receipt) {
        <div class="modal-backdrop">
          <mat-card class="modal-card">
            <div class="modal-header">
              <div>
                <h2>Stock Receipt Details</h2>
                <code class="ref-badge">{{ receipt.receiptReference }}</code>
              </div>
              <button mat-icon-button (click)="closeDetails()">
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
                  <span class="info-label">Received Date:</span>
                  <strong>{{ receipt.receivedDate | date:'medium' }}</strong>
                </div>
                <div>
                  <span class="info-label">Received By:</span>
                  <strong>{{ receipt.receivedByUsername }}</strong>
                </div>
                <div>
                  <span class="info-label">Total Quantity:</span>
                  <strong>{{ receipt.totalQuantityReceived }} units</strong>
                </div>
                @if (receipt.notes) {
                  <div class="span-2">
                    <span class="info-label">Notes:</span>
                    <span>{{ receipt.notes }}</span>
                  </div>
                }
              </div>

              <h3>Received Line Items</h3>
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
              <button mat-stroked-button (click)="closeDetails()">Close</button>
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
    .spacer {
      flex: 1;
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
    .units-badge {
      background: #e8eaf6;
      color: #283593;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.8rem;
    }
    .notes-col {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #64748b;
      font-size: 0.85rem;
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
      max-width: 700px;
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
export class ReceiptHistoryComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);

  readonly loading = signal(false);
  readonly receipts = signal<StockReceiptResponse[]>([]);
  readonly selectedReceipt = signal<StockReceiptResponse | null>(null);

  readonly currentPage = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);

  startDate = '';
  endDate = '';

  ngOnInit(): void {
    this.loadReceipts(0);
  }

  loadReceipts(page: number): void {
    this.loading.set(true);

    const startIso = this.startDate ? new Date(this.startDate + 'T00:00:00Z').toISOString() : undefined;
    const endIso = this.endDate ? new Date(this.endDate + 'T23:59:59Z').toISOString() : undefined;

    this.inventoryService.getReceiptHistory(startIso, endIso, page, 15).subscribe({
      next: (res) => {
        this.receipts.set(res.content ?? []);
        this.currentPage.set(res.number ?? page);
        this.totalPages.set(res.totalPages ?? 0);
        this.totalElements.set(res.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.loadReceipts(0);
  }

  resetFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadReceipts(0);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadReceipts(page);
    }
  }

  viewDetails(receipt: StockReceiptResponse): void {
    this.selectedReceipt.set(receipt);
  }

  closeDetails(): void {
    this.selectedReceipt.set(null);
  }
}
