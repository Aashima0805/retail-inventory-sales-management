import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <p>Welcome back, <strong>{{ currentUser()?.fullName }}</strong>. You have full administrative access.</p>
    </div>

    <div class="card-grid">
      <mat-card class="summary-card">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">bar_chart</mat-icon>
          <mat-card-title>Sales Reports</mat-card-title>
          <mat-card-subtitle>View and export sales data</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Access detailed sales summaries, top products and date-range reports.</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="summary-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>inventory_2</mat-icon>
          <mat-card-title>Inventory</mat-card-title>
          <mat-card-subtitle>Stock levels and movements</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Monitor stock levels, receive goods and manage adjustments.</p>
        </mat-card-content>
      </mat-card>

      <mat-card class="summary-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>history</mat-icon>
          <mat-card-title>Audit Logs</mat-card-title>
          <mat-card-subtitle>System-wide activity trail</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Review all system events with user attribution and timestamps.</p>
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
export class AdminDashboardComponent {
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.currentUser;
}
