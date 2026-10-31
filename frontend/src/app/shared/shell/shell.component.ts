import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/auth.models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Admin Dashboard',     icon: 'dashboard',      route: '/admin/dashboard',     roles: ['ROLE_ADMIN', 'ADMIN'] },
  { label: 'Products & Categories', icon: 'inventory_2',  route: '/admin/products',      roles: ['ROLE_ADMIN', 'ADMIN'] },
  { label: 'Suppliers',           icon: 'local_shipping', route: '/admin/suppliers',     roles: ['ROLE_ADMIN', 'ADMIN'] },
  { label: 'Staff Accounts',      icon: 'people',         route: '/admin/staff',         roles: ['ROLE_ADMIN', 'ADMIN'] },
  { label: 'Reports',             icon: 'bar_chart',      route: '/admin/reports',        roles: ['ROLE_ADMIN', 'ADMIN'] },
  { label: 'Audit Logs',          icon: 'history',        route: '/admin/audit-logs',     roles: ['ROLE_ADMIN', 'ADMIN'] },
  { label: 'Cashier Dashboard',   icon: 'dashboard',      route: '/cashier/dashboard',    roles: ['ROLE_CASHIER', 'CASHIER'] },
  { label: 'Point of Sale',       icon: 'point_of_sale',  route: '/cashier/pos',          roles: ['ROLE_CASHIER', 'CASHIER'] },
  { label: 'My Sales History',    icon: 'receipt_long',   route: '/cashier/history',      roles: ['ROLE_CASHIER', 'CASHIER'] },
  { label: 'Inventory Dashboard', icon: 'move_to_inbox',  route: '/inventory/dashboard',  roles: ['ROLE_INVENTORY_STAFF', 'INVENTORY_STAFF'] },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <!-- Sidebar -->
      <mat-sidenav mode="side" opened class="sidenav" role="navigation">
        <!-- Brand -->
        <div class="brand">
          <mat-icon class="brand-icon">store</mat-icon>
          <span class="brand-name">Retail IMS</span>
        </div>

        <mat-divider></mat-divider>

        <!-- Navigation -->
        <mat-nav-list>
          @for (item of visibleNavItems(); track item.route) {
            <a
              mat-list-item
              [routerLink]="item.route"
              routerLinkActive="active-link"
              [matTooltip]="item.label"
              matTooltipPosition="right"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <!-- Sidebar footer: user chip -->
        <div class="sidenav-footer">
          <mat-divider></mat-divider>
          <div class="user-chip">
            <mat-icon class="user-avatar-icon">account_circle</mat-icon>
            <div class="user-info">
              <span class="user-name">{{ currentUser()?.fullName ?? currentUser()?.username }}</span>
              <span class="user-role">{{ roleLabel() }}</span>
            </div>
          </div>
        </div>
      </mat-sidenav>

      <!-- Main content area -->
      <mat-sidenav-content>
        <!-- Top toolbar -->
        <mat-toolbar color="primary" class="top-toolbar">
          <span class="toolbar-spacer"></span>

          <!-- User menu -->
          <button mat-icon-button [matMenuTriggerFor]="userMenu" aria-label="User menu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="menu-user-info">
              <strong>{{ currentUser()?.fullName }}</strong>
              <small>{{ currentUser()?.username }}</small>
              <small class="role-badge">{{ roleLabel() }}</small>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        @if (loading()) {
          <mat-progress-bar mode="indeterminate" class="global-progress"></mat-progress-bar>
        }

        <!-- Page content -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }

    .sidenav {
      width: 240px;
      background: #1a237e;
      color: white;
      display: flex;
      flex-direction: column;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
    }

    .brand-icon {
      font-size: 28px;
      height: 28px;
      width: 28px;
      color: #90caf9;
    }

    .brand-name {
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: white;
    }

    mat-nav-list {
      flex: 1;
      padding-top: 8px;
    }

    a[mat-list-item] {
      color: rgba(255,255,255,0.85);
      border-radius: 0 24px 24px 0;
      margin-right: 8px;
      margin-bottom: 2px;
      transition: background 0.2s;
    }

    a[mat-list-item]:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    a[mat-list-item].active-link {
      background: rgba(255,255,255,0.18);
      color: white;
      font-weight: 600;
    }

    .sidenav-footer {
      margin-top: auto;
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
    }

    .user-avatar-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
      color: #90caf9;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.6);
    }

    .top-toolbar {
      height: 56px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    .toolbar-spacer {
      flex: 1;
    }

    .global-progress {
      position: absolute;
      top: 56px;
      left: 0;
      right: 0;
      z-index: 10;
    }

    .main-content {
      padding: 24px;
      background: #f8fafc;
      min-height: calc(100vh - 56px);
      box-sizing: border-box;
    }

    .menu-user-info {
      display: flex;
      flex-direction: column;
      padding: 12px 16px;
      gap: 2px;
      min-width: 180px;
    }

    .menu-user-info strong {
      font-size: 0.9rem;
    }

    .menu-user-info small {
      font-size: 0.78rem;
      color: #64748b;
    }

    .role-badge {
      display: inline-block;
      background: #e8eaf6;
      color: #3949ab;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 0.72rem;
      margin-top: 2px;
    }
  `],
})
export class ShellComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly loading = this.authService.loading;

  readonly visibleNavItems = computed(() => {
    const role = this.authService.userRole();
    if (!role) return [];
    const cleanRole = role.replace(/^ROLE_/, '');
    return NAV_ITEMS.filter((item) =>
      item.roles.some((r) => r.replace(/^ROLE_/, '') === cleanRole)
    );
  });

  readonly roleLabel = computed(() => {
    const role = this.authService.userRole();
    if (!role) return '';
    const cleanRole = role.replace(/^ROLE_/, '');
    const labels: Record<string, string> = {
      ADMIN: 'Administrator',
      CASHIER: 'Cashier',
      INVENTORY_STAFF: 'Inventory Staff',
    };
    return labels[cleanRole] ?? role;
  });

  logout(): void {
    this.authService.logout();
  }
}
