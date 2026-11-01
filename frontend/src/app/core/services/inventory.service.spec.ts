import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { InventoryService } from './inventory.service';
import { environment } from '../../../environments/environment';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InventoryService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(InventoryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('getStockListing sends GET with page/size params', () => {
    service.getStockListing(0, 20).subscribe();
    const req = httpTesting.expectOne(r => r.url === `${environment.apiUrl}/inventory/stock`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true });
  });

  it('getLowStockProducts sends GET to low-stock endpoint', () => {
    service.getLowStockProducts().subscribe();
    const req = httpTesting.expectOne(r => r.url === `${environment.apiUrl}/inventory/low-stock`);
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 100, number: 0, first: true, last: true });
  });

  it('recordIncomingStock sends POST with supplierId and items', () => {
    const payload = {
      supplierId: 1,
      notes: 'First delivery',
      items: [{ productId: 10, quantityReceived: 50, unitCost: 5.5 }],
    };
    service.recordIncomingStock(payload).subscribe();
    const req = httpTesting.expectOne(`${environment.apiUrl}/inventory/receipts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.supplierId).toBe(1);
    expect(req.request.body.items[0].productId).toBe(10);
    expect(req.request.body.items[0].quantityReceived).toBe(50);
    // unitCost must be sent (required by backend validation)
    expect(req.request.body.items[0].unitCost).toBe(5.5);
    req.flush({ id: 1, receiptReference: 'REC-20261101-0001' });
  });

  it('getReceiptHistory sends GET with date filters', () => {
    service.getReceiptHistory('2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', 0, 15).subscribe();
    const req = httpTesting.expectOne(r => r.url === `${environment.apiUrl}/inventory/receipts`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('startDate')).toBe('2026-01-01T00:00:00Z');
    expect(req.request.params.get('endDate')).toBe('2026-12-31T23:59:59Z');
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 15, number: 0, first: true, last: true });
  });

  it('getReceiptHistory omits date params when not provided', () => {
    service.getReceiptHistory(undefined, undefined, 0, 15).subscribe();
    const req = httpTesting.expectOne(r => r.url === `${environment.apiUrl}/inventory/receipts`);
    expect(req.request.params.has('startDate')).toBe(false);
    expect(req.request.params.has('endDate')).toBe(false);
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 15, number: 0, first: true, last: true });
  });

  it('getProductStockDetails sends GET with productId', () => {
    service.getProductStockDetails(42).subscribe();
    const req = httpTesting.expectOne(`${environment.apiUrl}/inventory/stock/42`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 42, name: 'Sample', sku: 'SMP-01', currentStock: 10, reorderLevel: 5 });
  });

  it('getActiveSuppliers sends GET with isActive=true', () => {
    service.getActiveSuppliers().subscribe();
    const req = httpTesting.expectOne(r => r.url === `${environment.apiUrl}/suppliers`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('isActive')).toBe('true');
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 200, number: 0, first: true, last: true });
  });

  it('getActiveProducts sends GET with isActive=true', () => {
    service.getActiveProducts().subscribe();
    const req = httpTesting.expectOne(r => r.url === `${environment.apiUrl}/products`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('isActive')).toBe('true');
    req.flush({ content: [], totalElements: 0, totalPages: 0, size: 500, number: 0, first: true, last: true });
  });
});
