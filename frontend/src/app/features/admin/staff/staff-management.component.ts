import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { StaffUser, CreateStaffRequest } from '../../../core/models/admin.models';

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [
    CommonModule,
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
        <h1>Staff Account Management</h1>
        <p>Manage user accounts, assign system roles and control system access.</p>
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
          <div class="summary-text">
            <span>Total Staff Accounts: <strong>{{ staffList().length }}</strong></span>
          </div>
          <button mat-raised-button color="accent" (click)="openCreateForm()">
            <mat-icon>person_add</mat-icon> Create Staff Account
          </button>
        </div>

        <!-- Add Staff Form -->
        @if (showCreateForm()) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>Create New Staff Account</mat-card-title>
              <mat-card-subtitle>User credentials are encrypted. Role determines permissions across POS, inventory and admin tools.</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="staffForm" (ngSubmit)="createStaff()">
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Username</mat-label>
                    <input matInput formControlName="username" autocomplete="off" placeholder="e.g. cashier2" />
                    @if (staffForm.get('username')?.invalid && staffForm.get('username')?.touched) {
                      <mat-error>Username is required (min 3 chars)</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Full Name</mat-label>
                    <input matInput formControlName="fullName" placeholder="e.g. Jane Doe" />
                    @if (staffForm.get('fullName')?.invalid && staffForm.get('fullName')?.touched) {
                      <mat-error>Full name is required</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Password</mat-label>
                    <input matInput type="password" formControlName="password" autocomplete="new-password" placeholder="At least 6 characters" />
                    @if (staffForm.get('password')?.invalid && staffForm.get('password')?.touched) {
                      <mat-error>Password must be at least 6 characters</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Role</mat-label>
                    <mat-select formControlName="role">
                      <mat-option value="ROLE_ADMIN">Admin (Full System Access)</mat-option>
                      <mat-option value="ROLE_CASHIER">Cashier (Sales & POS)</mat-option>
                      <mat-option value="ROLE_INVENTORY_STAFF">Inventory Staff (Stock Receipts & Adjustments)</mat-option>
                    </mat-select>
                    @if (staffForm.get('role')?.invalid && staffForm.get('role')?.touched) {
                      <mat-error>Role is required</mat-error>
                    }
                  </mat-form-field>
                </div>

                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelCreateForm()">Cancel</button>
                  <button mat-raised-button color="primary" type="submit" [disabled]="staffForm.invalid || loading()">
                    Create Account
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }

        <!-- Staff Accounts Table -->
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (staffList().length === 0) {
                <tr>
                  <td colspan="6" class="text-center py-4">No staff accounts found.</td>
                </tr>
              }
              @for (user of staffList(); track user.id) {
                <tr [class.inactive-row]="!user.isActive">
                  <td><code>{{ user.username }}</code></td>
                  <td><strong>{{ user.fullName }}</strong></td>
                  <td>
                    <span class="badge" [class.badge-admin]="user.role === 'ROLE_ADMIN' || user.role === 'ADMIN'"
                                       [class.badge-cashier]="user.role === 'ROLE_CASHIER' || user.role === 'CASHIER'"
                                       [class.badge-inventory]="user.role === 'ROLE_INVENTORY_STAFF' || user.role === 'INVENTORY_STAFF'">
                      {{ formatRole(user.role) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-active]="user.isActive" [class.badge-inactive]="!user.isActive">
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>{{ user.createdAt | date:'mediumDate' }}</td>
                  <td>
                    @if (user.username !== currentUsername()) {
                      @if (user.isActive) {
                        <button mat-stroked-button color="warn" (click)="toggleUserStatus(user, false)" [disabled]="loading()">
                          <mat-icon>person_off</mat-icon> Deactivate
                        </button>
                      } @else {
                        <button mat-stroked-button color="primary" (click)="toggleUserStatus(user, true)" [disabled]="loading()">
                          <mat-icon>person</mat-icon> Activate
                        </button>
                      }
                    } @else {
                      <span class="current-user-tag">(You)</span>
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
      margin-bottom: 1.5rem;
    }
    .summary-text {
      color: #475569;
      font-size: 0.95rem;
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
      min-width: 220px;
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
    .badge-admin { background: #fee2e2; color: #991b1b; }
    .badge-cashier { background: #dcfce7; color: #166534; }
    .badge-inventory { background: #fef3c7; color: #92400e; }
    .badge-active { background: #e0f2fe; color: #0369a1; }
    .badge-inactive { background: #f1f5f9; color: #64748b; }
    .current-user-tag {
      font-size: 0.8rem;
      color: #64748b;
      font-style: italic;
    }
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
export class StaffManagementComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly staffList = signal<StaffUser[]>([]);
  readonly feedbackMessage = signal<string | null>(null);
  readonly feedbackType = signal<'success' | 'error'>('success');
  readonly currentUsername = signal<string | undefined>(this.authService.currentUser()?.username);

  readonly showCreateForm = signal(false);
  staffForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadStaff();
  }

  private initForm(): void {
    this.staffForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      role: ['ROLE_CASHIER', Validators.required],
    });
  }

  loadStaff(): void {
    this.loading.set(true);
    this.adminService.getStaffUsers(0, 50).subscribe({
      next: (res) => {
        this.staffList.set(res.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.showFeedback('Failed to load staff accounts', 'error');
        this.loading.set(false);
      },
    });
  }

  openCreateForm(): void {
    this.staffForm.reset({
      username: '',
      fullName: '',
      password: '',
      role: 'ROLE_CASHIER',
    });
    this.showCreateForm.set(true);
  }

  cancelCreateForm(): void {
    this.showCreateForm.set(false);
  }

  createStaff(): void {
    if (this.staffForm.invalid) return;

    this.loading.set(true);
    const req: CreateStaffRequest = this.staffForm.value;

    this.adminService.createStaffUser(req).subscribe({
      next: (created) => {
        this.showFeedback(`Staff account '${created.username}' created successfully!`, 'success');
        this.showCreateForm.set(false);
        this.loadStaff();
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 409) {
          this.showFeedback(`Username '${req.username}' is already taken. Please choose another.`, 'error');
        } else {
          const detail = err?.error?.detail ?? 'Failed to create staff account';
          this.showFeedback(detail, 'error');
        }
      },
    });
  }

  toggleUserStatus(user: StaffUser, activate: boolean): void {
    const actionText = activate ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${actionText} staff account "${user.username}"?`)) {
      return;
    }

    this.loading.set(true);
    const action$ = activate
      ? this.adminService.activateStaffUser(user.id)
      : this.adminService.deactivateStaffUser(user.id);

    action$.subscribe({
      next: (updated) => {
        this.showFeedback(`Account '${updated.username}' is now ${updated.isActive ? 'active' : 'deactivated'}`, 'success');
        this.loadStaff();
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.detail ?? `Failed to ${actionText} account`;
        this.showFeedback(detail, 'error');
      },
    });
  }

  formatRole(role: string): string {
    const clean = role.replace(/^ROLE_/, '');
    switch (clean) {
      case 'ADMIN': return 'Administrator';
      case 'CASHIER': return 'Cashier';
      case 'INVENTORY_STAFF': return 'Inventory Staff';
      default: return role;
    }
  }

  private showFeedback(msg: string, type: 'success' | 'error'): void {
    this.feedbackMessage.set(msg);
    this.feedbackType.set(type);
    setTimeout(() => this.feedbackMessage.set(null), 5000);
  }
}
