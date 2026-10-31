import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  CurrentUser,
  UserRole,
} from '../models/auth.models';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  // Reactive state
  private readonly _currentUser = signal<CurrentUser | null>(null);
  private readonly _loading = signal(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userRole = computed(() => this._currentUser()?.role as UserRole | undefined);

  readonly isAdmin = computed(() => {
    const role = this._currentUser()?.role;
    return role === 'ROLE_ADMIN' || role === 'ADMIN';
  });

  readonly isCashier = computed(() => {
    const role = this._currentUser()?.role;
    return role === 'ROLE_CASHIER' || role === 'CASHIER';
  });

  readonly isInventoryStaff = computed(() => {
    const role = this._currentUser()?.role;
    return role === 'ROLE_INVENTORY_STAFF' || role === 'INVENTORY_STAFF';
  });

  /** Called at app startup to restore session from stored token. */
  initAuth(): Observable<CurrentUser | null> {
    const token = this.getToken();
    if (!token) {
      return of(null);
    }
    this._loading.set(true);
    return this.http.get<CurrentUser>(`${this.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this._currentUser.set(user);
        this._loading.set(false);
      }),
      catchError(() => {
        this.clearSession();
        this._loading.set(false);
        return of(null);
      }),
    );
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this._loading.set(true);
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          this.storeToken(response.token);
          this._currentUser.set({
            userId: response.userId,
            id: response.userId,
            username: response.username,
            fullName: response.fullName,
            role: response.role,
            isActive: true,
          });
          this._loading.set(false);
          this.navigateToDashboard(response.role);
        }),
        catchError((err) => {
          this._loading.set(false);
          return throwError(() => err);
        }),
      );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      // Best-effort server-side logout; don't block on failure
      this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
        error: () => { /* ignore */ },
      });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  /** Route user to the correct dashboard for their role. */
  navigateToDashboard(role?: string): void {
    const currentRole = role ?? this._currentUser()?.role;
    switch (currentRole) {
      case 'ROLE_ADMIN':
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'ROLE_CASHIER':
      case 'CASHIER':
        this.router.navigate(['/cashier/dashboard']);
        break;
      case 'ROLE_INVENTORY_STAFF':
      case 'INVENTORY_STAFF':
        this.router.navigate(['/inventory/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  storeToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  clearSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this._currentUser.set(null);
  }
}
