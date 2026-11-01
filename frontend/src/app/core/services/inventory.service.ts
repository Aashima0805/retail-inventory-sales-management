import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/api.models';
import {
  Product,
  Supplier,
  StockReceiptResponse,
} from '../models/admin.models';

export interface StockReceiptItemRequest {
  productId: number;
  quantityReceived: number;
  unitCost: number;
}

export interface StockReceiptRequest {
  supplierId: number;
  notes?: string;
  items: StockReceiptItemRequest[];
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** GET /api/v1/inventory/stock — paginated stock listing */
  getStockListing(page = 0, size = 20): Observable<PageResponse<Product>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Product>>(`${this.apiUrl}/inventory/stock`, { params });
  }

  /** GET /api/v1/inventory/low-stock — products at or below reorder level */
  getLowStockProducts(page = 0, size = 100): Observable<PageResponse<Product>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Product>>(`${this.apiUrl}/inventory/low-stock`, { params });
  }

  /** GET /api/v1/inventory/stock/{productId} */
  getProductStockDetails(productId: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/inventory/stock/${productId}`);
  }

  /** POST /api/v1/inventory/receipts — record incoming stock */
  recordIncomingStock(request: StockReceiptRequest): Observable<StockReceiptResponse> {
    return this.http.post<StockReceiptResponse>(`${this.apiUrl}/inventory/receipts`, request);
  }

  /** GET /api/v1/inventory/receipts — paginated receipt history */
  getReceiptHistory(
    startDate?: string,
    endDate?: string,
    page = 0,
    size = 15
  ): Observable<PageResponse<StockReceiptResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<PageResponse<StockReceiptResponse>>(
      `${this.apiUrl}/inventory/receipts`,
      { params }
    );
  }

  /** GET /api/v1/suppliers — for supplier dropdown (reuse admin endpoint) */
  getActiveSuppliers(): Observable<PageResponse<Supplier>> {
    const params = new HttpParams().set('isActive', true).set('page', 0).set('size', 200);
    return this.http.get<PageResponse<Supplier>>(`${this.apiUrl}/suppliers`, { params });
  }

  /** GET /api/v1/products — active products for product dropdown */
  getActiveProducts(): Observable<PageResponse<Product>> {
    const params = new HttpParams().set('isActive', true).set('page', 0).set('size', 500);
    return this.http.get<PageResponse<Product>>(`${this.apiUrl}/products`, { params });
  }
}
