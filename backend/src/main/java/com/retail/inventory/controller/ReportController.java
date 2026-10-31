package com.retail.inventory.controller;

import com.retail.inventory.dto.*;
import com.retail.inventory.service.ReportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

/**
 * ADMIN-only reporting endpoints under /api/v1/reports.
 * All endpoints require ROLE_ADMIN; CASHIER and INVENTORY_STAFF receive 403.
 */
@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * GET /api/v1/reports/sales-summary
     * Returns aggregate totals: total sales amount, number of sales, total items sold.
     * Optional date range filters.
     */
    @GetMapping("/sales-summary")
    public ResponseEntity<SalesSummaryResponse> getSalesSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate) {
        return ResponseEntity.ok(reportService.getSalesSummary(startDate, endDate));
    }

    /**
     * GET /api/v1/reports/sales
     * Paginated list of all sales with optional date range.
     */
    @GetMapping("/sales")
    public ResponseEntity<Page<SaleResponse>> getSalesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Pageable pageable) {
        return ResponseEntity.ok(reportService.getSalesReport(startDate, endDate, pageable));
    }

    /**
     * GET /api/v1/reports/top-products
     * Products ranked by total quantity sold (descending), paginated.
     */
    @GetMapping("/top-products")
    public ResponseEntity<Page<TopProductResponse>> getTopProducts(Pageable pageable) {
        return ResponseEntity.ok(reportService.getTopProducts(pageable));
    }

    /**
     * GET /api/v1/reports/inventory
     * Current stock and low-stock information for all active products.
     */
    @GetMapping("/inventory")
    public ResponseEntity<Page<InventoryReportResponse>> getInventoryReport(Pageable pageable) {
        return ResponseEntity.ok(reportService.getInventoryReport(pageable));
    }

    /**
     * GET /api/v1/reports/stock-movements
     * Combined view of incoming stock receipts and stock adjustments.
     * Returns receipts by default; pass type=ADJUSTMENTS to see adjustments only.
     * Optional date range.
     */
    @GetMapping("/stock-movements")
    public ResponseEntity<?> getStockMovements(
            @RequestParam(required = false, defaultValue = "RECEIPTS") String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Pageable pageable) {

        if ("ADJUSTMENTS".equalsIgnoreCase(type)) {
            Page<StockAdjustmentResponse> adjustments =
                    reportService.getStockAdjustments(startDate, endDate, pageable);
            return ResponseEntity.ok(adjustments);
        }
        // Default: RECEIPTS
        Page<StockReceiptResponse> receipts =
                reportService.getStockReceipts(startDate, endDate, pageable);
        return ResponseEntity.ok(receipts);
    }
}
