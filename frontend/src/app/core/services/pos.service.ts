import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../models/api.models';
import { Product, SaleResponse } from '../models/admin.models';
import { CartItem, CheckoutRequest } from '../models/pos.models';

@Injectable({ providedIn: 'root' })
export class PosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Reactive Cart State
  private readonly _cart = signal<CartItem[]>([]);
  readonly cart = this._cart.asReadonly();

  readonly cartTotalQuantity = computed(() =>
    this._cart().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly cartGrandTotal = computed(() => {
    const total = this._cart().reduce((sum, item) => sum + item.lineTotal, 0);
    return Math.round(total * 100) / 100;
  });

  addToCart(product: Product, quantity = 1): { success: boolean; message?: string } {
    if (!product.isActive) {
      return { success: false, message: `Product '${product.name}' is inactive and cannot be sold.` };
    }

    if (product.currentStock <= 0) {
      return { success: false, message: `Product '${product.name}' is out of stock.` };
    }

    const currentItems = [...this._cart()];
    const existingIndex = currentItems.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const currentItem = currentItems[existingIndex];
      const newQty = currentItem.quantity + quantity;

      if (newQty > product.currentStock) {
        return {
          success: false,
          message: `Cannot add more than available stock (${product.currentStock}) for '${product.name}'.`,
        };
      }

      currentItems[existingIndex] = {
        ...currentItem,
        quantity: newQty,
        lineTotal: Math.round(newQty * product.price * 100) / 100,
      };
    } else {
      if (quantity > product.currentStock) {
        return {
          success: false,
          message: `Requested quantity exceeds available stock (${product.currentStock}).`,
        };
      }

      currentItems.push({
        product,
        quantity,
        lineTotal: Math.round(quantity * product.price * 100) / 100,
      });
    }

    this._cart.set(currentItems);
    return { success: true };
  }

  updateQuantity(productId: number, quantity: number): { success: boolean; message?: string } {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return { success: true };
    }

    const currentItems = [...this._cart()];
    const itemIndex = currentItems.findIndex((item) => item.product.id === productId);

    if (itemIndex === -1) {
      return { success: false, message: 'Item not in cart.' };
    }

    const item = currentItems[itemIndex];
    if (quantity > item.product.currentStock) {
      return {
        success: false,
        message: `Quantity exceeds available stock (${item.product.currentStock}).`,
      };
    }

    currentItems[itemIndex] = {
      ...item,
      quantity,
      lineTotal: Math.round(quantity * item.product.price * 100) / 100,
    };

    this._cart.set(currentItems);
    return { success: true };
  }

  removeFromCart(productId: number): void {
    this._cart.update((items) => items.filter((item) => item.product.id !== productId));
  }

  clearCart(): void {
    this._cart.set([]);
  }

  // API Methods
  searchProducts(keyword?: string, categoryId?: number, page = 0, size = 50): Observable<PageResponse<Product>> {
    let params = new HttpParams()
      .set('isActive', true)
      .set('page', page)
      .set('size', size);

    if (keyword && keyword.trim()) {
      params = params.set('keyword', keyword.trim());
    }
    if (categoryId !== undefined && categoryId !== null) {
      params = params.set('categoryId', categoryId);
    }

    return this.http.get<PageResponse<Product>>(`${this.apiUrl}/products`, { params });
  }

  checkout(): Observable<SaleResponse> {
    const items = this._cart();
    const payload: CheckoutRequest = {
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    return this.http.post<SaleResponse>(`${this.apiUrl}/sales`, payload).pipe(
      tap(() => this.clearCart())
    );
  }

  getMySales(startDate?: string, endDate?: string, page = 0, size = 20): Observable<PageResponse<SaleResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<PageResponse<SaleResponse>>(`${this.apiUrl}/sales`, { params });
  }

  getSaleById(id: number): Observable<SaleResponse> {
    return this.http.get<SaleResponse>(`${this.apiUrl}/sales/${id}`);
  }
}
