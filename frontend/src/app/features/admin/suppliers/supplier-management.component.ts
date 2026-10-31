import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AdminService } from '../../../core/services/admin.service';
import { Supplier, SupplierRequest } from '../../../core/models/admin.models';

@Component({
  selector: 'app-supplier-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
        <h1>Supplier Management</h1>
        <p>Maintain vendor directory and contact information for stock deliveries.</p>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-3"></mat-progress-bar>
      }

      @if (feedbackMessage()) {
        <div class="feedback-banner" [class.success]="feedbackType() === 'success'" [class.error]="feedbackType() === 'error'">
          <mat-icon>{{ feedbackType() === 'success' ? 'check_circle' : 'error' }}</mat-icon>
          <span>{{ feedbackMessage() }}</span>
        </div>
      }

      <mat-card class="content-card">
        <div class="toolbar">
          <div class="filters">
            <mat-form-field appearance="outline" density="compact" class="search-input">
              <mat-label>Search Suppliers</mat-label>
              <input matInput [(ngModel)]="searchKeyword" (keyup.enter)="loadSuppliers()" placeholder="e.g. Apex, Rajesh" />
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" density="compact">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="selectedStatusFilter" (selectionChange)="loadSuppliers()">
                <mat-option [value]="null">All Suppliers</mat-option>
                <mat-option [value]="true">Active Only</mat-option>
                <mat-option [value]="false">Inactive Only</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-flat-button color="primary" (click)="loadSuppliers()">Filter</button>
            <button mat-stroked-button (click)="resetFilters()">Reset</button>
          </div>

          <button mat-raised-button color="accent" (click)="openForm()">
            <mat-icon>add_business</mat-icon> New Supplier
          </button>
        </div>

        <!-- Supplier Form -->
        @if (showForm()) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingSupplierId() ? 'Edit Supplier' : 'Add New Supplier' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="supplierForm" (ngSubmit)="saveSupplier()">
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Supplier Name</mat-label>
                    <input matInput formControlName="name" placeholder="e.g. Apex Food Distributors" />
                    @if (supplierForm.get('name')?.invalid && supplierForm.get('name')?.touched) {
                      <mat-error>Name is required (max 150 chars)</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Contact Person</mat-label>
                    <input matInput formControlName="contactPerson" placeholder="e.g. Rajesh Sharma" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Phone</mat-label>
                    <input matInput formControlName="phone" placeholder="+91 98765 43210" />
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput type="email" formControlName="email" placeholder="orders@supplier.com" />
                    @if (supplierForm.get('email')?.invalid && supplierForm.get('email')?.touched) {
                      <mat-error>Enter a valid email address</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="flex-grow">
                    <mat-label>Address</mat-label>
                    <input matInput formControlName="address" placeholder="Physical location / city" />
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelForm()">Cancel</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="supplierForm.invalid || loading()">
                    {{ editingSupplierId() ? 'Update Supplier' : 'Save Supplier' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- Suppliers Table -->
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (suppliers().length === 0) {
                <tr>
                  <td colspan="7" class="text-center py-4">No suppliers found matching criteria.</td>
                </tr>
              }
              @for (s of suppliers(); track s.id) {
                <tr [class.inactive-row]="!s.isActive">
                  <td><strong>{{ s.name }}</strong></td>
                  <td>{{ s.contactPerson ?? '-' }}</td>
                  <td>{{ s.phone ?? '-' }}</td>
                  <td>{{ s.email ?? '-' }}</td>
                  <td>{{ s.address ?? '-' }}</td>
                  <td>
                    <span class="badge" [class.badge-active]="s.isActive" [class.badge-inactive]="!s.isActive">
                      {{ s.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button mat-icon-button color="primary" (click)="editSupplier(s)" title="Edit Supplier">
                      <mat-icon>edit</mat-icon>
                    </button>
                    @if (s.isActive) {
                      <button mat-icon-button color="warn" (click)="deactivateSupplier(s)" title="Deactivate Supplier">
                        <mat-icon>block</mat-icon>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .filters {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-input {
      min-width: 220px;
    }
    .form-card {
      margin-bottom: 1.5rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }
    .form-row mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    .flex-grow {
      flex: 2 !important;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
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
    .inactive-row {
      opacity: 0.6;
      background: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-active { background: #e0f2fe; color: #0369a1; }
    .badge-inactive { background: #f1f5f9; color: #64748b; }
    .feedback-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .feedback-banner.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .feedback-banner.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
  `],
})
export class SupplierManagementComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly suppliers = signal<Supplier[]>([]);
  readonly feedbackMessage = signal<string | null>(null);
  readonly feedbackType = signal<'success' | 'error'>('success');

  readonly showForm = signal(false);
  readonly editingSupplierId = signal<number | null>(null);
  supplierForm!: FormGroup;

  searchKeyword = '';
  selectedStatusFilter: boolean | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadSuppliers();
  }

  private initForm(): void {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      contactPerson: ['', [Validators.maxLength(100)]],
      phone: ['', [Validators.maxLength(25)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      address: [''],
    });
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.adminService
      .getSuppliers({
        keyword: this.searchKeyword.trim() || undefined,
        isActive: this.selectedStatusFilter ?? undefined,
        page: 0,
        size: 50,
      })
      .subscribe({
        next: (res) => {
          this.suppliers.set(res.content ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.showFeedback('Failed to load suppliers', 'error');
          this.loading.set(false);
        },
      });
  }

  resetFilters(): void {
    this.searchKeyword = '';
    this.selectedStatusFilter = null;
    this.loadSuppliers();
  }

  openForm(): void {
    this.editingSupplierId.set(null);
    this.supplierForm.reset({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
    });
    this.showForm.set(true);
  }

  editSupplier(s: Supplier): void {
    this.editingSupplierId.set(s.id);
    this.supplierForm.setValue({
      name: s.name,
      contactPerson: s.contactPerson ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      address: s.address ?? '',
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingSupplierId.set(null);
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) return;

    this.loading.set(true);
    const req: SupplierRequest = this.supplierForm.value;
    const supId = this.editingSupplierId();

    const action$ = supId
      ? this.adminService.updateSupplier(supId, req)
      : this.adminService.createSupplier(req);

    action$.subscribe({
      next: () => {
        this.showFeedback(supId ? 'Supplier updated successfully' : 'Supplier added successfully', 'success');
        this.showForm.set(false);
        this.loadSuppliers();
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.detail ?? 'Failed to save supplier';
        this.showFeedback(detail, 'error');
      },
    });
  }

  deactivateSupplier(s: Supplier): void {
    if (!confirm(`Are you sure you want to deactivate supplier "${s.name}"?`)) {
      return;
    }
    this.loading.set(true);
    this.adminService.deactivateSupplier(s.id).subscribe({
      next: () => {
        this.showFeedback(`Supplier "${s.name}" deactivated`, 'success');
        this.loadSuppliers();
      },
      error: () => {
        this.loading.set(false);
        this.showFeedback('Failed to deactivate supplier', 'error');
      },
    });
  }

  private showFeedback(msg: string, type: 'success' | 'error'): void {
    this.feedbackMessage.set(msg);
    this.feedbackType.set(type);
    setTimeout(() => this.feedbackMessage.set(null), 5000);
  }
}
