export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryRequest {
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category: Category;
  price: number;
  currentStock: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  description?: string;
  categoryId: number;
  price: number;
  reorderLevel: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface StaffUser {
  id: number;
  username: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStaffRequest {
  username: string;
  fullName: string;
  password: string;
  role: string;
}

export interface SalesSummaryResponse {
  totalSalesAmount: number;
  numberOfSales: number;
  totalItemsSold: number;
}

export interface TopProductResponse {
  productId: number;
  productSku: string;
  productName: string;
  totalQuantitySold: number;
}

export interface InventoryReportResponse {
  productId: number;
  sku: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  isActive: boolean;
  isLowStock: boolean;
  price: number;
}

export interface SaleItemResponse {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface SaleResponse {
  id: number;
  receiptNumber: string;
  cashierId: number;
  cashierUsername: string;
  cashierFullName: string;
  saleDate: string;
  totalAmount: number;
  items: SaleItemResponse[];
  createdAt: string;
}

export interface StockReceiptItemResponse {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  quantityReceived: number;
  unitCost: number;
}

export interface StockReceiptResponse {
  id: number;
  receiptReference: string;
  supplierId: number;
  supplierName: string;
  receivedByUsername: string;
  receivedDate: string;
  notes?: string;
  totalQuantityReceived: number;
  items?: StockReceiptItemResponse[];
  createdAt: string;
}

export interface StockAdjustmentResponse {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  performedByUsername: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  adjustmentDate: string;
}

export interface AuditLogResponse {
  id: number;
  eventType: string;
  entityName: string;
  entityId: number;
  performedByUsername?: string;
  description?: string;
  timestamp: string;
}
