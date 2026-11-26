import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { AdminService } from '../../../core/services/admin.service';
import { Category, Product, ProductRequest, CategoryRequest } from '../../../core/models/admin.models';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <div class="page-container">
      <div class="header-section">
        <h1>Product & Category Management</h1>
        <p>Manage retail inventory catalog, pricing and categorization.</p>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-3"></mat-progress-bar>
      }

      @if (feedbackMessage()) {
        <div class="feedback-banner" [class.success]="feedbackType() === 'success'" [class.error]="feedbackType() === 'error'">
          <mat-icon>{{ feedbackType() === 'success' ? 'check_circle' : 'error' }}</mat-icon>
          <span>{{ feedbackMessage() }}</span>
        </div>
      }

      <mat-card class="content-card">
        <mat-tab-group animationDuration="0ms">
          <!-- PRODUCTS TAB -->
          <mat-tab label="Products">
            <div class="tab-body">
              <!-- Search & Filters Bar -->
              <div class="toolbar">
                <div class="filters">
                  <mat-form-field appearance="outline" density="compact" class="search-input">
                    <mat-label>Search SKU / Name</mat-label>
                    <input matInput [(ngModel)]="searchKeyword" (keyup.enter)="applyProductFilters()" placeholder="e.g. Milk, BEV-001" />
                    <mat-icon matPrefix>search</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" density="compact">
                    <mat-label>Category</mat-label>
                    <mat-select [(ngModel)]="selectedCategoryFilter" (selectionChange)="applyProductFilters()">
                      <mat-option [value]="null">All Categories</mat-option>
                      @for (cat of categories(); track cat.id) {
                        <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" density="compact">
                    <mat-label>Status</mat-label>
                    <mat-select [(ngModel)]="selectedStatusFilter" (selectionChange)="applyProductFilters()">
                      <mat-option [value]="null">All Statuses</mat-option>
                      <mat-option [value]="true">Active Only</mat-option>
                      <mat-option [value]="false">Inactive Only</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <button mat-flat-button color="primary" (click)="applyProductFilters()">Filter</button>
                  <button mat-stroked-button (click)="resetProductFilters()">Reset</button>
                </div>

                <button mat-raised-button color="accent" (click)="openProductForm()">
                  <mat-icon>add</mat-icon> New Product
                </button>
              </div>

              <!-- Product Form (Add/Edit) -->
              @if (showProductForm()) {
                <mat-card class="form-card">
                  <mat-card-header>
                    <mat-card-title>{{ editingProductId() ? 'Edit Product' : 'Add New Product' }}</mat-card-title>
                    <mat-card-subtitle>Stock levels must be adjusted via receipts or adjustments, not direct editing.</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <form [formGroup]="productForm" (ngSubmit)="saveProduct()">
                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>SKU</mat-label>
                          <input matInput formControlName="sku" placeholder="e.g. BEV-005" />
                          @if (productForm.get('sku')?.invalid && productForm.get('sku')?.touched) {
                            <mat-error>SKU is required</mat-error>
                          }
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Product Name</mat-label>
                          <input matInput formControlName="name" placeholder="e.g. Cold Brew Coffee" />
                          @if (productForm.get('name')?.invalid && productForm.get('name')?.touched) {
                            <mat-error>Name is required</mat-error>
                          }
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Category</mat-label>
                          <mat-select formControlName="categoryId">
                            @for (cat of categories(); track cat.id) {
                              <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
                            }
                          </mat-select>
                          @if (productForm.get('categoryId')?.invalid && productForm.get('categoryId')?.touched) {
                            <mat-error>Category is required</mat-error>
                          }
                        </mat-form-field>
                      </div>

                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Price (₹)</mat-label>
                          <input matInput type="number" step="0.01" min="0" formControlName="price" />
                          @if (productForm.get('price')?.invalid && productForm.get('price')?.touched) {
                            <mat-error>Valid price is required</mat-error>
                          }
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Reorder Level</mat-label>
                          <input matInput type="number" min="0" formControlName="reorderLevel" />
                          @if (productForm.get('reorderLevel')?.invalid && productForm.get('reorderLevel')?.touched) {
                            <mat-error>Reorder level is required</mat-error>
                          }
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="flex-grow">
                          <mat-label>Description</mat-label>
                          <input matInput formControlName="description" placeholder="Optional notes" />
                        </mat-form-field>
                      </div>

                      <div class="form-actions">
                        <button mat-button type="button" (click)="cancelProductForm()">Cancel</button>
                        <button mat-raised-button color="primary" type="submit" [disabled]="productForm.invalid || loading()">
                          {{ editingProductId() ? 'Update Product' : 'Create Product' }}
                        </button>
                      </div>
                    </form>
                  </mat-card-content>
                </mat-card>
              }

              <!-- Products Table -->
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Reorder Level</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (products().length === 0) {
                      <tr>
                        <td colspan="8" class="text-center py-4">No products found matching filters.</td>
                      </tr>
                    }
                    @for (p of products(); track p.id) {
                      <tr [class.inactive-row]="!p.isActive">
                        <td><code>{{ p.sku }}</code></td>
                        <td><strong>{{ p.name }}</strong></td>
                        <td>{{ p.category.name }}</td>
                        <td>₹{{ p.price | number:'1.2-2' }}</td>
                        <td>
                          <span class="badge" [class.badge-danger]="p.currentStock <= p.reorderLevel" [class.badge-success]="p.currentStock > p.reorderLevel">
                            {{ p.currentStock }}
                          </span>
                        </td>
                        <td>{{ p.reorderLevel }}</td>
                        <td>
                          <span class="badge" [class.badge-active]="p.isActive" [class.badge-inactive]="!p.isActive">
                            {{ p.isActive ? 'Active' : 'Inactive' }}
                          </span>
                        </td>
                        <td>
                          <button mat-icon-button color="accent" (click)="openAdjustmentDialog(p)" title="Adjust Stock (Manual Correction)">
                            <mat-icon>tune</mat-icon>
                          </button>
                          <button mat-icon-button color="primary" (click)="editProduct(p)" title="Edit Product">
                            <mat-icon>edit</mat-icon>
                          </button>
                          @if (p.isActive) {
                            <button mat-icon-button color="warn" (click)="deactivateProduct(p)" title="Deactivate Product">
                              <mat-icon>block</mat-icon>
                            </button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- CATEGORIES TAB -->
          <mat-tab label="Categories">
            <div class="tab-body">
              <div class="toolbar">
                <div></div>
                <button mat-raised-button color="accent" (click)="openCategoryForm()">
                  <mat-icon>add</mat-icon> New Category
                </button>
              </div>

              <!-- Category Form -->
              @if (showCategoryForm()) {
                <mat-card class="form-card">
                  <mat-card-header>
                    <mat-card-title>{{ editingCategoryId() ? 'Edit Category' : 'Add New Category' }}</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()">
                      <div class="form-row">
                        <mat-form-field appearance="outline">
                          <mat-label>Category Name</mat-label>
                          <input matInput formControlName="name" placeholder="e.g. Frozen Foods" />
                          @if (categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched) {
                            <mat-error>Category name is required</mat-error>
                          }
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="flex-grow">
                          <mat-label>Description</mat-label>
                          <input matInput formControlName="description" placeholder="Category description" />
                        </mat-form-field>
                      </div>

                      <div class="form-actions">
                        <button mat-button type="button" (click)="cancelCategoryForm()">Cancel</button>
                        <button mat-raised-button color="primary" type="submit" [disabled]="categoryForm.invalid || loading()">
                          {{ editingCategoryId() ? 'Update Category' : 'Create Category' }}
                        </button>
                      </div>
                    </form>
                  </mat-card-content>
                </mat-card>
              }

              <!-- Categories Table -->
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th style="width: 80px;">ID</th>
                      <th>Category Name</th>
                      <th>Description</th>
                      <th style="width: 100px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (cat of categories(); track cat.id) {
                      <tr>
                        <td>{{ cat.id }}</td>
                        <td><strong>{{ cat.name }}</strong></td>
                        <td>{{ cat.description }}</td>
                        <td>
                          <button mat-icon-button color="primary" (click)="editCategory(cat)" title="Edit Category">
                            <mat-icon>edit</mat-icon>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- STOCK ADJUSTMENT MODAL -->
      @if (adjustingProduct(); as product) {
        <div class="modal-backdrop">
          <mat-card class="modal-dialog-card">
            <div class="modal-header">
              <div class="header-title-wrap">
                <mat-icon color="accent" class="modal-title-icon">tune</mat-icon>
                <div>
                  <h2>Adjust Stock Level</h2>
                  <p>Product: <strong>{{ product.name }}</strong> (<code>{{ product.sku }}</code>)</p>
                </div>
              </div>
              <button mat-icon-button (click)="closeAdjustmentDialog()" [disabled]="adjustmentLoading()">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <mat-divider></mat-divider>

            <div class="modal-body">
              <div class="stock-overview-box">
                <div class="stat-col">
                  <span class="stat-label">Current Stock</span>
                  <span class="stat-val">{{ product.currentStock }}</span>
                </div>
                <div class="stat-col-arrow">
                  <mat-icon>arrow_forward</mat-icon>
                </div>
                <div class="stat-col">
                  <span class="stat-label">Adjustment</span>
                  <span class="stat-val" [class.text-green]="adjustmentQuantityChange > 0" [class.text-red]="adjustmentQuantityChange < 0">
                    {{ adjustmentQuantityChange > 0 ? '+' + adjustmentQuantityChange : adjustmentQuantityChange }}
                  </span>
                </div>
                <div class="stat-col-arrow">
                  <mat-icon>trending_flat</mat-icon>
                </div>
                <div class="stat-col">
                  <span class="stat-label">New Balance</span>
                  <span class="stat-val new-balance" [class.text-red]="(product.currentStock + adjustmentQuantityChange) < 0">
                    {{ product.currentStock + adjustmentQuantityChange }}
                  </span>
                </div>
              </div>

              @if ((product.currentStock + adjustmentQuantityChange) < 0) {
                <div class="warning-banner">
                  <mat-icon>error</mat-icon>
                  <span>Resulting stock cannot be negative. Maximum reduction is {{ product.currentStock }}.</span>
                </div>
              }

              <div class="form-group-field">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Quantity Change (+/-)</mat-label>
                  <input
                    matInput
                    type="number"
                    [(ngModel)]="adjustmentQuantityChange"
                    placeholder="e.g. -5 for damage, +10 for correction"
                    required
                  />
                  <mat-hint>Enter negative number to reduce, positive to increase.</mat-hint>
                </mat-form-field>
              </div>

              <div class="quick-reasons-wrap">
                <span class="quick-reasons-label">Common Reasons:</span>
                <div class="chips-list">
                  <button type="button" class="reason-pill" (click)="setReason('Damaged / Broken stock')">Damaged</button>
                  <button type="button" class="reason-pill" (click)="setReason('Annual inventory audit discrepancy')">Audit Discrepancy</button>
                  <button type="button" class="reason-pill" (click)="setReason('Stock shrinkage / Lost')">Shrinkage / Loss</button>
                  <button type="button" class="reason-pill" (click)="setReason('Expired / spoiled goods')">Expired / Spoiled</button>
                  <button type="button" class="reason-pill" (click)="setReason('Returned to stock')">Returned</button>
                </div>
              </div>

              <div class="form-group-field">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Adjustment Reason *</mat-label>
                  <input
                    matInput
                    [(ngModel)]="adjustmentReason"
                    placeholder="Explain why this manual adjustment is being recorded"
                    maxlength="255"
                    required
                  />
                </mat-form-field>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="modal-footer">
              <button mat-button (click)="closeAdjustmentDialog()" [disabled]="adjustmentLoading()">Cancel</button>
              <button
                mat-raised-button
                color="primary"
                (click)="submitStockAdjustment()"
                [disabled]="adjustmentLoading() || !isAdjustmentValid()"
              >
                <mat-icon>check_circle</mat-icon>
                {{ adjustmentLoading() ? 'Saving...' : 'Apply Stock Adjustment' }}
              </button>
            </div>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header-section {
      margin-bottom: 1.5rem;
    }
    .header-section h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a237e;
    }
    .header-section p {
      color: #64748b;
      margin: 0;
    }
    .mb-3 { margin-bottom: 1rem; }
    .content-card {
      border-radius: 12px;
      overflow: hidden;
    }
    .tab-body {
      padding: 1.5rem;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .filters {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-input {
      min-width: 220px;
    }
    .form-card {
      margin-bottom: 1.5rem;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }
    .form-row mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    .flex-grow {
      flex: 2 !important;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .table-wrap {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .inactive-row {
      opacity: 0.6;
      background: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    .badge-success { background: #dcfce7; color: #16a34a; }
    .badge-active { background: #e0f2fe; color: #0369a1; }
    .badge-inactive { background: #f1f5f9; color: #64748b; }
    .feedback-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .feedback-banner.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .feedback-banner.error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 1rem;
    }
    .modal-dialog-card {
      max-width: 550px;
      width: 100%;
      border-radius: 12px;
      padding: 1.5rem;
      background: white;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    .header-title-wrap {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .modal-title-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }
    .modal-header p {
      margin: 2px 0 0;
      font-size: 0.85rem;
      color: #64748b;
    }
    .modal-body {
      padding: 1rem 0;
    }
    .stock-overview-box {
      display: flex;
      justify-content: space-around;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.25rem;
    }
    .stat-col {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .stat-val {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1e293b;
    }
    .new-balance {
      color: #1a237e;
    }
    .stat-col-arrow mat-icon {
      color: #94a3b8;
    }
    .text-green { color: #16a34a !important; }
    .text-red { color: #dc2626 !important; }
    .warning-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fee2e2;
      color: #991b1b;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }
    .form-group-field {
      margin-bottom: 0.5rem;
    }
    .w-100 {
      width: 100%;
    }
    .quick-reasons-wrap {
      margin-bottom: 1rem;
    }
    .quick-reasons-label {
      font-size: 0.8rem;
      color: #64748b;
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .chips-list {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .reason-pill {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 4px 10px;
      font-size: 0.75rem;
      color: #334155;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .reason-pill:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }
  `],
})
export class ProductManagementComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly feedbackMessage = signal<string | null>(null);
  readonly feedbackType = signal<'success' | 'error'>('success');

  // Product form states
  readonly showProductForm = signal(false);
  readonly editingProductId = signal<number | null>(null);
  productForm!: FormGroup;

  // Category form states
  readonly showCategoryForm = signal(false);
  readonly editingCategoryId = signal<number | null>(null);
  categoryForm!: FormGroup;

  // Stock Adjustment state
  readonly adjustingProduct = signal<Product | null>(null);
  readonly adjustmentLoading = signal(false);
  adjustmentQuantityChange = 0;
  adjustmentReason = '';

  // Filters
  searchKeyword = '';
  selectedCategoryFilter: number | null = null;
  selectedStatusFilter: boolean | null = null;

  ngOnInit(): void {
    this.initForms();
    this.loadCategories();
    this.loadProducts();
  }

  private initForms(): void {
    this.productForm = this.fb.group({
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(150)]],
      description: [''],
      categoryId: [null, Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [10, [Validators.required, Validators.min(0)]],
    });

    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
    });
  }

  loadCategories(): void {
    this.adminService.getCategories(0, 100).subscribe({
      next: (res) => this.categories.set(res.content ?? []),
      error: () => this.showFeedback('Failed to load categories', 'error'),
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.adminService
      .getProducts({
        keyword: this.searchKeyword.trim() || undefined,
        categoryId: this.selectedCategoryFilter ?? undefined,
        isActive: this.selectedStatusFilter ?? undefined,
        page: 0,
        size: 50,
      })
      .subscribe({
        next: (res) => {
          this.products.set(res.content ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.showFeedback('Failed to load products', 'error');
          this.loading.set(false);
        },
      });
  }

  applyProductFilters(): void {
    this.loadProducts();
  }

  resetProductFilters(): void {
    this.searchKeyword = '';
    this.selectedCategoryFilter = null;
    this.selectedStatusFilter = null;
    this.loadProducts();
  }

  openProductForm(): void {
    this.editingProductId.set(null);
    this.productForm.reset({
      sku: '',
      name: '',
      description: '',
      categoryId: this.categories()[0]?.id ?? null,
      price: 0,
      reorderLevel: 10,
    });
    this.showProductForm.set(true);
  }

  editProduct(p: Product): void {
    this.editingProductId.set(p.id);
    this.productForm.setValue({
      sku: p.sku,
      name: p.name,
      description: p.description ?? '',
      categoryId: p.category?.id ?? null,
      price: p.price,
      reorderLevel: p.reorderLevel,
    });
    this.showProductForm.set(true);
  }

  cancelProductForm(): void {
    this.showProductForm.set(false);
    this.editingProductId.set(null);
  }

  saveProduct(): void {
    if (this.productForm.invalid) return;

    this.loading.set(true);
    const formVal = this.productForm.value;
    const req: ProductRequest = {
      sku: formVal.sku,
      name: formVal.name,
      description: formVal.description,
      categoryId: formVal.categoryId,
      price: formVal.price,
      reorderLevel: formVal.reorderLevel,
    };

    const editId = this.editingProductId();
    const action$ = editId
      ? this.adminService.updateProduct(editId, req)
      : this.adminService.createProduct(req);

    action$.subscribe({
      next: () => {
        this.showFeedback(editId ? 'Product updated successfully' : 'Product created successfully', 'success');
        this.showProductForm.set(false);
        this.loadProducts();
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.detail ?? 'Failed to save product';
        this.showFeedback(detail, 'error');
      },
    });
  }

  deactivateProduct(p: Product): void {
    if (!confirm(`Are you sure you want to deactivate product "${p.name}" (${p.sku})?`)) {
      return;
    }
    this.loading.set(true);
    this.adminService.deactivateProduct(p.id).subscribe({
      next: () => {
        this.showFeedback(`Product "${p.name}" has been deactivated`, 'success');
        this.loadProducts();
      },
      error: () => {
        this.loading.set(false);
        this.showFeedback('Failed to deactivate product', 'error');
      },
    });
  }

  // Category methods
  openCategoryForm(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ name: '', description: '' });
    this.showCategoryForm.set(true);
  }

  editCategory(cat: Category): void {
    this.editingCategoryId.set(cat.id);
    this.categoryForm.setValue({
      name: cat.name,
      description: cat.description ?? '',
    });
    this.showCategoryForm.set(true);
  }

  cancelCategoryForm(): void {
    this.showCategoryForm.set(false);
    this.editingCategoryId.set(null);
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    this.loading.set(true);
    const req: CategoryRequest = this.categoryForm.value;
    const catId = this.editingCategoryId();

    const action$ = catId
      ? this.adminService.updateCategory(catId, req)
      : this.adminService.createCategory(req);

    action$.subscribe({
      next: () => {
        this.showFeedback(catId ? 'Category updated' : 'Category created', 'success');
        this.showCategoryForm.set(false);
        this.loadCategories();
      },
      error: (err) => {
        this.loading.set(false);
        const detail = err?.error?.detail ?? 'Failed to save category';
        this.showFeedback(detail, 'error');
      },
    });
  }

  // Stock Adjustment methods
  openAdjustmentDialog(p: Product): void {
    this.adjustingProduct.set(p);
    this.adjustmentQuantityChange = 0;
    this.adjustmentReason = '';
  }

  closeAdjustmentDialog(): void {
    this.adjustingProduct.set(null);
    this.adjustmentQuantityChange = 0;
    this.adjustmentReason = '';
  }

  setReason(reason: string): void {
    this.adjustmentReason = reason;
  }

  isAdjustmentValid(): boolean {
    const prod = this.adjustingProduct();
    if (!prod) return false;
    if (!this.adjustmentQuantityChange || this.adjustmentQuantityChange === 0) return false;
    if ((prod.currentStock + this.adjustmentQuantityChange) < 0) return false;
    return !!this.adjustmentReason.trim();
  }

  submitStockAdjustment(): void {
    const prod = this.adjustingProduct();
    if (!prod || !this.isAdjustmentValid()) return;

    this.adjustmentLoading.set(true);
    this.adminService
      .adjustStock({
        productId: prod.id,
        quantityChange: Number(this.adjustmentQuantityChange),
        reason: this.adjustmentReason.trim(),
      })
      .subscribe({
        next: (res) => {
          this.adjustmentLoading.set(false);
          const changeStr = res.quantityChange > 0 ? `+${res.quantityChange}` : `${res.quantityChange}`;
          this.showFeedback(
            `Stock adjusted for ${res.productSku}: ${res.previousStock} → ${res.newStock} (${changeStr})`,
            'success'
          );
          this.closeAdjustmentDialog();
          this.loadProducts();
        },
        error: (err) => {
          this.adjustmentLoading.set(false);
          const detail = err?.error?.detail ?? err?.error?.message ?? 'Failed to adjust stock';
          this.showFeedback(detail, 'error');
        },
      });
  }

  private showFeedback(msg: string, type: 'success' | 'error'): void {
    this.feedbackMessage.set(msg);
    this.feedbackType.set(type);
    setTimeout(() => this.feedbackMessage.set(null), 5000);
  }
}
