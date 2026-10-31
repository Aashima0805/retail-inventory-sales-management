import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="login-logo">
            <mat-icon class="logo-icon">store</mat-icon>
          </div>
          <mat-card-title>Retail IMS</mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (errorMessage()) {
            <div class="error-banner" role="alert">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input
                matInput
                formControlName="username"
                autocomplete="username"
                [attr.aria-label]="'Username'"
              />
              <mat-icon matPrefix>person</mat-icon>
              @if (loginForm.get('username')?.touched && loginForm.get('username')?.hasError('required')) {
                <mat-error>Username is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password"
                autocomplete="current-password"
                [attr.aria-label]="'Password'"
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePasswordVisibility()"
                [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (loginForm.get('password')?.touched && loginForm.get('password')?.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width login-btn"
              [disabled]="loginForm.invalid || loading()"
            >
              @if (loading()) {
                <span class="btn-spinner-wrapper">
                  <mat-spinner diameter="20" color="accent"></mat-spinner>
                  <span>Signing in…</span>
                </span>
              } @else {
                <span class="btn-spinner-wrapper">
                  <mat-icon>login</mat-icon>
                  <span>Sign In</span>
                </span>
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
      padding: 1rem;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      border-radius: 12px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.3);
    }

    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 2rem 1rem;
    }

    .login-logo {
      background: #3949ab;
      border-radius: 50%;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .logo-icon {
      font-size: 36px;
      height: 36px;
      width: 36px;
      color: white;
    }

    mat-card-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a237e;
    }

    mat-card-content {
      padding: 1rem 2rem 2rem;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fde8e8;
      border: 1px solid #f56565;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      color: #c53030;
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 0.5rem;
    }

    .login-btn {
      margin-top: 1rem;
      height: 48px;
      font-size: 1rem;
      letter-spacing: 0.5px;
    }

    .btn-spinner-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);
  readonly loading = this.authService.loading;

  togglePasswordVisibility(): void {
    this.hidePassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.errorMessage.set(null);

    const { username, password } = this.loginForm.value as { username: string; password: string };

    this.authService.login({ username, password }).subscribe({
      error: (err: unknown) => {
        const httpErr = err as HttpErrorResponse;
        if (httpErr.status === 401 || httpErr.status === 403) {
          this.errorMessage.set('Invalid username or password. Please try again.');
        } else if (httpErr.status === 0) {
          this.errorMessage.set('Cannot connect to the server. Please check your network.');
        } else {
          const detail = (httpErr.error as { detail?: string })?.detail;
          this.errorMessage.set(detail ?? 'An unexpected error occurred. Please try again.');
        }
      },
    });
  }
}
