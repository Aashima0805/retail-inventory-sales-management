import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PosService } from './pos.service';
import { Product } from '../models/admin.models';
import { environment } from '../../../environments/environment';

describe('PosService', () => {
  let service: PosService;
  let httpTesting: HttpTestingController;

  const mockProduct: Product = {
    id: 10,
    sku: 'BEV-001',
    name: 'Mineral Water 1L',
    price: 20.0,
    currentStock: 15,
    reorderLevel: 5,
    isActive: true,
    category: { id: 1, name: 'Beverages' },
  };

  const outOfStockProduct: Product = {
    id: 11,
    sku: 'BEV-002',
    name: 'Orange Juice 1L',
    price: 85.0,
    currentStock: 0,
    reorderLevel: 5,
    isActive: true,
    category: { id: 1, name: 'Beverages' },
  };

  const inactiveProduct: Product = {
    id: 12,
    sku: 'BEV-003',
    name: 'Old Soda',
    price: 30.0,
    currentStock: 10,
    reorderLevel: 2,
    isActive: false,
    category: { id: 1, name: 'Beverages' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PosService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PosService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    service.clearCart();
  });

  it('adds active product with sufficient stock to cart', () => {
    const result = service.addToCart(mockProduct, 2);
    expect(result.success).toBe(true);
    expect(service.cart().length).toBe(1);
    expect(service.cartTotalQuantity()).toBe(2);
    expect(service.cartGrandTotal()).toBe(40.0);
  });

  it('rejects adding inactive product to cart', () => {
    const result = service.addToCart(inactiveProduct, 1);
    expect(result.success).toBe(false);
    expect(result.message).toContain('inactive');
    expect(service.cart().length).toBe(0);
  });

  it('rejects adding product with zero stock to cart', () => {
    const result = service.addToCart(outOfStockProduct, 1);
    expect(result.success).toBe(false);
    expect(result.message).toContain('out of stock');
    expect(service.cart().length).toBe(0);
  });

  it('prevents adding quantity exceeding available stock', () => {
    const result = service.addToCart(mockProduct, 20); // available is 15
    expect(result.success).toBe(false);
    expect(result.message).toContain('exceeds available stock');
    expect(service.cart().length).toBe(0);
  });

  it('increments quantity and recalculates line total when adding same product again', () => {
    service.addToCart(mockProduct, 2);
    const result = service.addToCart(mockProduct, 3);
    expect(result.success).toBe(true);
    expect(service.cart().length).toBe(1);
    expect(service.cart()[0].quantity).toBe(5);
    expect(service.cart()[0].lineTotal).toBe(100.0);
    expect(service.cartGrandTotal()).toBe(100.0);
  });

  it('updates quantity and recalculates totals correctly', () => {
    service.addToCart(mockProduct, 2);
    const result = service.updateQuantity(mockProduct.id, 4);
    expect(result.success).toBe(true);
    expect(service.cart()[0].quantity).toBe(4);
    expect(service.cart()[0].lineTotal).toBe(80.0);
    expect(service.cartGrandTotal()).toBe(80.0);
  });

  it('removes item from cart when quantity updated to 0', () => {
    service.addToCart(mockProduct, 2);
    service.updateQuantity(mockProduct.id, 0);
    expect(service.cart().length).toBe(0);
    expect(service.cartGrandTotal()).toBe(0);
  });

  it('removes item directly from cart', () => {
    service.addToCart(mockProduct, 2);
    service.removeFromCart(mockProduct.id);
    expect(service.cart().length).toBe(0);
  });

  it('checkout sends only product IDs and quantities, and clears cart on success', () => {
    service.addToCart(mockProduct, 2);

    const mockSaleResponse = {
      id: 50,
      receiptNumber: 'SALE-20261031-9999',
      cashierId: 2,
      cashierUsername: 'cashier1',
      cashierFullName: 'Alice Cashier',
      saleDate: '2026-10-31T12:00:00Z',
      totalAmount: 40.0,
      items: [
        {
          id: 1,
          productId: 10,
          productSku: 'BEV-001',
          productName: 'Mineral Water 1L',
          quantity: 2,
          unitPrice: 20.0,
          lineTotal: 40.0,
        },
      ],
      createdAt: '2026-10-31T12:00:00Z',
    };

    service.checkout().subscribe((sale) => {
      expect(sale.receiptNumber).toBe('SALE-20261031-9999');
      expect(sale.totalAmount).toBe(40.0);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/sales`);
    expect(req.request.method).toBe('POST');
    // Ensure ONLY product ID and quantity are sent!
    expect(req.request.body).toEqual({
      items: [{ productId: 10, quantity: 2 }],
    });
    // Price and totals must NEVER be in request body
    expect(req.request.body.price).toBeUndefined();
    expect(req.request.body.totalAmount).toBeUndefined();

    req.flush(mockSaleResponse);

    // Cart must be cleared after successful checkout
    expect(service.cart().length).toBe(0);
  });

  it('checkout does not clear cart when request fails with 400', () => {
    service.addToCart(mockProduct, 2);

    service.checkout().subscribe({
      error: (err) => {
        expect(err.status).toBe(400);
      },
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/sales`);
    req.flush({ detail: 'Insufficient stock' }, { status: 400, statusText: 'Bad Request' });

    // Cart is preserved so cashier can adjust quantity
    expect(service.cart().length).toBe(1);
  });
});
