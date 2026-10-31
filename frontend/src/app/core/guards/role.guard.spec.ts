import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let mockAuthService: { userRole: ReturnType<typeof vi.fn> };
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAuthService = {
      userRole: vi.fn(),
    };
    mockRouter = {
      createUrlTree: vi.fn().mockImplementation((path) => path[0]),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('allows access when user has matching role', () => {
    mockAuthService.userRole.mockReturnValue('ROLE_ADMIN');
    const guard = roleGuard(['ROLE_ADMIN']);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('allows access when role matches without prefix', () => {
    mockAuthService.userRole.mockReturnValue('ADMIN');
    const guard = roleGuard(['ROLE_ADMIN']);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('redirects to /unauthorized when user role does not match allowed roles', () => {
    mockAuthService.userRole.mockReturnValue('ROLE_CASHIER');
    const guard = roleGuard(['ROLE_ADMIN']);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/unauthorized']);
    expect(result).toBe('/unauthorized');
  });

  it('redirects to /login when user has no role', () => {
    mockAuthService.userRole.mockReturnValue(undefined);
    const guard = roleGuard(['ROLE_ADMIN']);
    const result = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toBe('/login');
  });
});
