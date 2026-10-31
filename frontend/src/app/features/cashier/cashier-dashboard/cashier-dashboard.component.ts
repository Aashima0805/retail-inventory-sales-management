import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cashier-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard-header">
      <h1>Cashier Dashboard</h1>
      <p>Welcome, <strong>{{ currentUser()?.fullName }}</strong>. Process sales and view your history here.</p>
    </div>

    <div class="card-grid">
      <mat-card class="summary-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>point_of_sale</mat-icon>
          <mat-card-title>New Sale</mat-card-title>
          <mat-card-subtitle>Process a customer checkout</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Scan products, review totals and complete a sale transaction.</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="summary-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>receipt_long</mat-icon>
          <mat-card-title>My Sales</mat-card-title>
          <mat-card-subtitle>Review your transaction history</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Browse receipts from your previous sales sessions.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-header { margin-bottom: 2rem; }
    .dashboard-header h1 { margin: 0 0 0.25rem; font-size: 1.75rem; font-weight: 600; color: #1a237e; }
    .dashboard-header p  { color: #475569; margin: 0; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .summary-card { border-radius: 12px; }
    mat-card-content p { color: #64748b; font-size: 0.9rem; }
  `],
})
export class CashierDashboardComponent {
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;
}
