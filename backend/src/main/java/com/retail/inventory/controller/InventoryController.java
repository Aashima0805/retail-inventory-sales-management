package com.retail.inventory.controller;

import com.retail.inventory.dto.*;
import com.retail.inventory.security.CustomUserDetails;
import com.retail.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/receipts")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<StockReceiptResponse> recordIncomingStock(
            @Valid @RequestBody StockReceiptRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        StockReceiptResponse response = inventoryService.recordIncomingStock(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/receipts")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF')")
    public ResponseEntity<Page<StockReceiptResponse>> getReceiptHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Pageable pageable) {
        Page<StockReceiptResponse> receipts = inventoryService.getReceiptHistory(startDate, endDate, pageable);
        return ResponseEntity.ok(receipts);
    }

    @PostMapping("/adjustments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StockAdjustmentResponse> adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        StockAdjustmentResponse response = inventoryService.adjustStock(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'INVENTORY_STAFF')")
    public ResponseEntity<Page<ProductResponse>> getStockListing(Pageable pageable) {
        Page<ProductResponse> stock = inventoryService.getStockListing(pageable);
        return ResponseEntity.ok(stock);
    }

    @GetMapping("/stock/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'INVENTORY_STAFF')")
    public ResponseEntity<ProductResponse> getProductStockDetails(@PathVariable Long productId) {
        ProductResponse product = inventoryService.getProductStockDetails(productId);
        return ResponseEntity.ok(product);
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'INVENTORY_STAFF')")
    public ResponseEntity<Page<ProductResponse>> getLowStockProducts(Pageable pageable) {
        Page<ProductResponse> lowStock = inventoryService.getLowStockProducts(pageable);
        return ResponseEntity.ok(lowStock);
    }
}
