import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/api.models';
import {
  Category,
  CategoryRequest,
  Product,
  ProductRequest,
  Supplier,
  SupplierRequest,
  StaffUser,
  CreateStaffRequest,
  SalesSummaryResponse,
  TopProductResponse,
  InventoryReportResponse,
  SaleResponse,
  StockReceiptResponse,
  StockAdjustmentResponse,
  AuditLogResponse,
} from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Categories
  getCategories(page = 0, size = 100): Observable<PageResponse<Category>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Category>>(`${this.apiUrl}/categories`, { params });
  }

  createCategory(req: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, req);
  }

  updateCategory(id: number, req: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, req);
  }

  // Products
  getProducts(filter?: {
    keyword?: string;
    categoryId?: number;
    isActive?: boolean;
    page?: number;
    size?: number;
  }): Observable<PageResponse<Product>> {
    let params = new HttpParams()
      .set('page', filter?.page ?? 0)
      .set('size', filter?.size ?? 10);

    if (filter?.keyword) {
      params = params.set('keyword', filter.keyword);
    }
    if (filter?.categoryId !== undefined && filter.categoryId !== null) {
      params = params.set('categoryId', filter.categoryId);
    }
    if (filter?.isActive !== undefined && filter.isActive !== null) {
      params = params.set('isActive', filter.isActive);
    }

    return this.http.get<PageResponse<Product>>(`${this.apiUrl}/products`, { params });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(req: ProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, req);
  }

  updateProduct(id: number, req: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, req);
  }

  deactivateProduct(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/products/${id}/deactivate`, {});
  }

  // Suppliers
  getSuppliers(filter?: {
    keyword?: string;
    isActive?: boolean;
    page?: number;
    size?: number;
  }): Observable<PageResponse<Supplier>> {
    let params = new HttpParams()
      .set('page', filter?.page ?? 0)
      .set('size', filter?.size ?? 10);

    if (filter?.keyword) {
      params = params.set('keyword', filter.keyword);
    }
    if (filter?.isActive !== undefined && filter.isActive !== null) {
      params = params.set('isActive', filter.isActive);
    }

    return this.http.get<PageResponse<Supplier>>(`${this.apiUrl}/suppliers`, { params });
  }

  createSupplier(req: SupplierRequest): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.apiUrl}/suppliers`, req);
  }

  updateSupplier(id: number, req: SupplierRequest): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/suppliers/${id}`, req);
  }

  deactivateSupplier(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/suppliers/${id}/deactivate`, {});
  }

  // Staff Users
  getStaffUsers(page = 0, size = 50): Observable<PageResponse<StaffUser>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<StaffUser>>(`${this.apiUrl}/users`, { params });
  }

  createStaffUser(req: CreateStaffRequest): Observable<StaffUser> {
    return this.http.post<StaffUser>(`${this.apiUrl}/users`, req);
  }

  deactivateStaffUser(id: number): Observable<StaffUser> {
    return this.http.patch<StaffUser>(`${this.apiUrl}/users/${id}/deactivate`, {});
  }

  activateStaffUser(id: number): Observable<StaffUser> {
    return this.http.patch<StaffUser>(`${this.apiUrl}/users/${id}/activate`, {});
  }

  // Reports
  getSalesSummary(startDate?: string, endDate?: string): Observable<SalesSummaryResponse> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<SalesSummaryResponse>(`${this.apiUrl}/reports/sales-summary`, { params });
  }

  getSalesReport(filter?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Observable<PageResponse<SaleResponse>> {
    let params = new HttpParams()
      .set('page', filter?.page ?? 0)
      .set('size', filter?.size ?? 10);

    if (filter?.startDate) params = params.set('startDate', filter.startDate);
    if (filter?.endDate) params = params.set('endDate', filter.endDate);

    return this.http.get<PageResponse<SaleResponse>>(`${this.apiUrl}/reports/sales`, { params });
  }

  getTopProducts(page = 0, size = 5): Observable<PageResponse<TopProductResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<TopProductResponse>>(`${this.apiUrl}/reports/top-products`, { params });
  }

  getInventoryReport(page = 0, size = 20): Observable<PageResponse<InventoryReportResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<InventoryReportResponse>>(`${this.apiUrl}/reports/inventory`, { params });
  }

  getStockMovements(
    type: 'RECEIPTS' | 'ADJUSTMENTS',
    filter?: { startDate?: string; endDate?: string; page?: number; size?: number }
  ): Observable<PageResponse<StockReceiptResponse | StockAdjustmentResponse>> {
    let params = new HttpParams()
      .set('type', type)
      .set('page', filter?.page ?? 0)
      .set('size', filter?.size ?? 10);

    if (filter?.startDate) params = params.set('startDate', filter.startDate);
    if (filter?.endDate) params = params.set('endDate', filter.endDate);

    return this.http.get<PageResponse<StockReceiptResponse | StockAdjustmentResponse>>(
      `${this.apiUrl}/reports/stock-movements`,
      { params }
    );
  }

  // Audit Logs
  getAuditLogs(filter?: {
    eventType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Observable<PageResponse<AuditLogResponse>> {
    let params = new HttpParams()
      .set('page', filter?.page ?? 0)
      .set('size', filter?.size ?? 15);

    if (filter?.eventType) params = params.set('eventType', filter.eventType);
    if (filter?.startDate) params = params.set('startDate', filter.startDate);
    if (filter?.endDate) params = params.set('endDate', filter.endDate);

    return this.http.get<PageResponse<AuditLogResponse>>(`${this.apiUrl}/audit-logs`, { params });
  }
}
