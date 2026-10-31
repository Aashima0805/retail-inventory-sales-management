import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { environment } from '../../../environments/environment';

describe('AdminService', () => {
  let service: AdminService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AdminService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('fetches categories', () => {
    const mockCategories = {
      content: [{ id: 1, name: 'Beverages' }],
      totalElements: 1,
      totalPages: 1,
      size: 100,
      number: 0,
      first: true,
      last: true,
    };

    service.getCategories().subscribe((res) => {
      expect(res.content.length).toBe(1);
      expect(res.content[0].name).toBe('Beverages');
    });

    const req = httpTesting.expectOne((r) => r.url === `${environment.apiUrl}/categories`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
  });

  it('fetches products with filters', () => {
    const mockProducts = {
      content: [{ id: 1, sku: 'BEV-001', name: 'Water' }],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
    };

    service.getProducts({ keyword: 'Water', isActive: true }).subscribe((res) => {
      expect(res.content.length).toBe(1);
      expect(res.content[0].sku).toBe('BEV-001');
    });

    const req = httpTesting.expectOne((r) =>
      r.url === `${environment.apiUrl}/products` &&
      r.params.get('keyword') === 'Water' &&
      r.params.get('isActive') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('creates staff user', () => {
    const newStaff = {
      username: 'cashier2',
      fullName: 'Bob Cashier',
      password: 'password123',
      role: 'ROLE_CASHIER',
    };
    const responseStaff = {
      id: 5,
      username: 'cashier2',
      fullName: 'Bob Cashier',
      role: 'ROLE_CASHIER',
      isActive: true,
    };

    service.createStaffUser(newStaff).subscribe((res) => {
      expect(res.id).toBe(5);
      expect(res.username).toBe('cashier2');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newStaff);
    req.flush(responseStaff);
  });

  it('fetches sales summary', () => {
    const mockSummary = {
      totalSalesAmount: 1540.5,
      numberOfSales: 12,
      totalItemsSold: 35,
    };

    service.getSalesSummary('2026-01-01', '2026-12-31').subscribe((res) => {
      expect(res.totalSalesAmount).toBe(1540.5);
      expect(res.numberOfSales).toBe(12);
    });

    const req = httpTesting.expectOne((r) =>
      r.url === `${environment.apiUrl}/reports/sales-summary` &&
      r.params.get('startDate') === '2026-01-01'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('fetches audit logs with event type filter', () => {
    const mockLogs = {
      content: [
        {
          id: 1,
          eventType: 'SALE_COMPLETED',
          entityName: 'Sale',
          entityId: 10,
          timestamp: '2026-10-31T12:00:00Z',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 15,
      number: 0,
      first: true,
      last: true,
    };

    service.getAuditLogs({ eventType: 'SALE_COMPLETED' }).subscribe((res) => {
      expect(res.content.length).toBe(1);
      expect(res.content[0].eventType).toBe('SALE_COMPLETED');
    });

    const req = httpTesting.expectOne((r) =>
      r.url === `${environment.apiUrl}/audit-logs` &&
      r.params.get('eventType') === 'SALE_COMPLETED'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockLogs);
  });
});
