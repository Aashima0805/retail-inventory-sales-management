import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="unauthorized-container">
      <mat-card class="unauthorized-card">
        <mat-card-header>
          <div class="icon-circle">
            <mat-icon>gpp_bad</mat-icon>
          </div>
          <mat-card-title>Access Denied</mat-card-title>
          <mat-card-subtitle>403 - Forbidden</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>You do not have permission to access the requested page or feature.</p>
          <p>Please contact your system administrator if you believe this is in error.</p>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-raised-button color="primary" (click)="goToDashboard()">
            <mat-icon>dashboard</mat-icon>
            <span>Back to Dashboard</span>
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 1.5rem;
    }
    .unauthorized-card {
      max-width: 480px;
      width: 100%;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      padding: 1.5rem;
    }
    .icon-circle {
      background: #fee2e2;
      color: #dc2626;
      border-radius: 50%;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .icon-circle mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    mat-card-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }
    mat-card-content {
      margin-top: 1rem;
      color: #64748b;
      font-size: 0.95rem;
    }
    mat-card-actions {
      margin-top: 1.5rem;
      padding: 0;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
  `],
})
export class UnauthorizedComponent {
  private readonly authService = inject(AuthService);

  goToDashboard(): void {
    this.authService.navigateToDashboard();
  }
}
