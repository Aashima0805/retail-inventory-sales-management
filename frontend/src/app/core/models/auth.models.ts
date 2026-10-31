export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType?: string;
  userId?: number;
  expiresIn?: number;
  username: string;
  fullName: string;
  role: string;
}

export interface CurrentUser {
  userId?: number;
  id?: number;
  username: string;
  fullName: string;
  role: string;
  isActive?: boolean;
}

export type UserRole =
  | 'ROLE_ADMIN'
  | 'ROLE_CASHIER'
  | 'ROLE_INVENTORY_STAFF'
  | 'ADMIN'
  | 'CASHIER'
  | 'INVENTORY_STAFF';

