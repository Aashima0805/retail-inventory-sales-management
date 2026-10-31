import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

/**
 * Factory that creates a role guard for the given allowed roles.
 * Returns redirect to /unauthorized when the authenticated user's role is not in the allowed list.
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.userRole();
    if (!userRole) {
      return router.createUrlTree(['/login']);
    }

    const cleanUserRole = userRole.replace(/^ROLE_/, '');
    const isAllowed = allowedRoles.some((allowed) => {
      const cleanAllowed = allowed.replace(/^ROLE_/, '');
      return cleanAllowed === cleanUserRole;
    });

    if (isAllowed) {
      return true;
    }

    return router.createUrlTree(['/unauthorized']);
  };
};
