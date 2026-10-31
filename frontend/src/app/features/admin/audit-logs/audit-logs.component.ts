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
import { AdminService } from '../../../core/services/admin.service';
import { AuditLogResponse } from '../../../core/models/admin.models';

@Component({
  selector: 'app-audit-logs',
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
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <h1>Audit Logs</h1>
        <p>Complete historical trail of administrative, inventory and sales transactions.</p>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-3"></mat-progress-bar>
      }

      <mat-card class="content-card">
        <!-- Filter Toolbar -->
        <div class="toolbar">
          <div class="filters">
            <mat-form-field appearance="outline" density="compact">
              <mat-label>Event Type</mat-label>
              <mat-select [(ngModel)]="selectedEventType" (selectionChange)="loadLogs(0)">
                <mat-option value="">All Events</mat-option>
                <mat-option value="SALE_COMPLETED">SALE_COMPLETED</mat-option>
                <mat-option value="STOCK_RECEIPT">STOCK_RECEIPT</mat-option>
                <mat-option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT</mat-option>
                <mat-option value="PRODUCT_CREATED">PRODUCT_CREATED</mat-option>
                <mat-option value="PRODUCT_UPDATED">PRODUCT_UPDATED</mat-option>
                <mat-option value="PRODUCT_DEACTIVATED">PRODUCT_DEACTIVATED</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" density="compact">
              <mat-label>Start Date (ISO)</mat-label>
              <input matInput [(ngModel)]="startDate" placeholder="2026-01-01T00:00:00Z" />
            </mat-form-field>

            <mat-form-field appearance="outline" density="compact">
              <mat-label>End Date (ISO)</mat-label>
              <input matInput [(ngModel)]="endDate" placeholder="2026-12-31T23:59:59Z" />
            </mat-form-field>

            <button mat-flat-button color="primary" (click)="loadLogs(0)">Filter</button>
            <button mat-stroked-button (click)="resetFilters()">Reset</button>
          </div>
        </div>

        <!-- Logs Table -->
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 170px;">Timestamp</th>
                <th>Event Type</th>
                <th>Target Entity</th>
                <th>Entity ID</th>
                <th>Performed By</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              @if (logs().length === 0) {
                <tr>
                  <td colspan="6" class="text-center py-4">No audit logs matching current criteria.</td>
                </tr>
              }
              @for (log of logs(); track log.id) {
                <tr>
                  <td>{{ log.timestamp | date:'medium' }}</td>
                  <td>
                    <span class="badge" [class.badge-sale]="log.eventType.includes('SALE')"
                                       [class.badge-stock]="log.eventType.includes('STOCK')"
                                       [class.badge-product]="log.eventType.includes('PRODUCT')">
                      {{ log.eventType }}
                    </span>
                  </td>
                  <td>{{ log.entityName }}</td>
                  <td><code>#{{ log.entityId }}</code></td>
                  <td><strong>{{ log.performedByUsername ?? 'SYSTEM' }}</strong></td>
                  <td>{{ log.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <div class="pagination-bar">
          <span>Page {{ currentPage() + 1 }} of {{ totalPages() > 0 ? totalPages() : 1 }} (Total: {{ totalElements() }} entries)</span>
          <div class="page-buttons">
            <button mat-stroked-button [disabled]="currentPage() === 0 || loading()" (click)="loadLogs(currentPage() - 1)">
              Previous
            </button>
            <button mat-stroked-button [disabled]="currentPage() >= totalPages() - 1 || loading()" (click)="loadLogs(currentPage() + 1)">
              Next
            </button>
          </div>
        </div>
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
    .content-card {
      border-radius: 12px;
      padding: 1.5rem;
    }
    .toolbar {
      margin-bottom: 1.5rem;
    }
    .filters {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
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
      background: #f1f5f9;
      color: #475569;
    }
    .badge-sale { background: #dcfce7; color: #166534; }
    .badge-stock { background: #fef3c7; color: #92400e; }
    .badge-product { background: #e0f2fe; color: #0369a1; }
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }
    .page-buttons {
      display: flex;
      gap: 0.5rem;
    }
  `],
})
export class AuditLogsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(false);
  readonly logs = signal<AuditLogResponse[]>([]);
  readonly currentPage = signal(0);
  readonly totalPages = signal(1);
  readonly totalElements = signal(0);

  selectedEventType = '';
  startDate = '';
  endDate = '';

  ngOnInit(): void {
    this.loadLogs(0);
  }

  loadLogs(page: number): void {
    this.loading.set(true);
    this.currentPage.set(page);

    this.adminService
      .getAuditLogs({
        eventType: this.selectedEventType.trim() || undefined,
        startDate: this.startDate.trim() || undefined,
        endDate: this.endDate.trim() || undefined,
        page,
        size: 15,
      })
      .subscribe({
        next: (res) => {
          this.logs.set(res.content ?? []);
          this.totalPages.set(res.totalPages ?? 1);
          this.totalElements.set(res.totalElements ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  resetFilters(): void {
    this.selectedEventType = '';
    this.startDate = '';
    this.endDate = '';
    this.loadLogs(0);
  }
}
