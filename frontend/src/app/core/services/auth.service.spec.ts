import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    sessionStorage.clear();
    mockRouter = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  it('authenticates user and stores token on login', () => {
    const mockLoginResponse = {
      token: 'jwt-test-token',
      userId: 1,
      username: 'admin',
      fullName: 'Store Manager',
      role: 'ROLE_ADMIN',
    };

    service.login({ username: 'admin', password: 'password123' }).subscribe((res) => {
      expect(res).toEqual(mockLoginResponse);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockLoginResponse);

    expect(service.getToken()).toBe('jwt-test-token');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('routes cashier to cashier dashboard on login', () => {
    const mockLoginResponse = {
      token: 'cashier-token',
      userId: 2,
      username: 'cashier1',
      fullName: 'Alice Cashier',
      role: 'ROLE_CASHIER',
    };

    service.login({ username: 'cashier1', password: 'password123' }).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush(mockLoginResponse);

    expect(service.isCashier()).toBe(true);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/cashier/dashboard']);
  });

  it('clears token and session on logout', () => {
    service.storeToken('existing-token');
    expect(service.getToken()).toBe('existing-token');

    service.logout();

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null);

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('loads current user on initAuth with token', () => {
    service.storeToken('saved-token');

    const mockUser = {
      userId: 1,
      username: 'admin',
      fullName: 'Store Manager',
      role: 'ROLE_ADMIN',
    };

    service.initAuth().subscribe((user) => {
      expect(user).toEqual(mockUser);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.username).toBe('admin');
  });

  it('clears session when initAuth fails with 401', () => {
    service.storeToken('expired-token');

    service.initAuth().subscribe((user) => {
      expect(user).toBeNull();
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/me`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
