import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LoginComponent } from './features/auth/login/login.component';
import { ShellComponent } from './shared/shell/shell.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { CashierDashboardComponent } from './features/cashier/cashier-dashboard/cashier-dashboard.component';
import { InventoryDashboardComponent } from './features/inventory/inventory-dashboard/inventory-dashboard.component';
import { UnauthorizedComponent } from './shared/unauthorized/unauthorized.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AuthService } from './core/services/auth.service';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [
          () => {
            const auth = inject(AuthService);
            const router = inject(Router);
            const role = auth.userRole();
            if (!role) {
              return router.createUrlTree(['/login']);
            }
            const cleanRole = role.replace(/^ROLE_/, '');
            switch (cleanRole) {
              case 'ADMIN':
                return router.createUrlTree(['/admin/dashboard']);
              case 'CASHIER':
                return router.createUrlTree(['/cashier/dashboard']);
              case 'INVENTORY_STAFF':
                return router.createUrlTree(['/inventory/dashboard']);
              default:
                return router.createUrlTree(['/unauthorized']);
            }
          },
        ],
        component: AdminDashboardComponent, // fallback placeholder for route matcher
      },
      {
        path: 'admin/dashboard',
        component: AdminDashboardComponent,
        canActivate: [roleGuard(['ROLE_ADMIN', 'ADMIN'])],
      },
      {
        path: 'cashier/dashboard',
        component: CashierDashboardComponent,
        canActivate: [roleGuard(['ROLE_CASHIER', 'CASHIER'])],
      },
      {
        path: 'inventory/dashboard',
        component: InventoryDashboardComponent,
        canActivate: [roleGuard(['ROLE_INVENTORY_STAFF', 'INVENTORY_STAFF'])],
      },
      {
        path: 'unauthorized',
        component: UnauthorizedComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
