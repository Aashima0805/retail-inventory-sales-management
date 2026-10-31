import { Product } from './admin.models';

export interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface CheckoutItemRequest {
  productId: number;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutItemRequest[];
}
