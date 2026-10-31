import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard-header">
      <h1>Inventory Dashboard</h1>
      <p>Welcome, <strong>{{ currentUser()?.fullName }}</strong>. Manage stock levels and receipts.</p>
    </div>

    <div class="card-grid">
      <mat-card class="summary-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>move_to_inbox</mat-icon>
          <mat-card-title>Receive Stock</mat-card-title>
          <mat-card-subtitle>Record incoming deliveries</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Log stock receipts from suppliers and update product quantities.</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="summary-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>inventory</mat-icon>
          <mat-card-title>Stock Levels</mat-card-title>
          <mat-card-subtitle>Current inventory overview</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Check current stock and view low-stock alerts for reorder planning.</p>
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
export class InventoryDashboardComponent {
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;
}
