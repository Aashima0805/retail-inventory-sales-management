package com.retail.inventory.service;

import com.retail.inventory.dto.*;
import com.retail.inventory.entity.Product;
import com.retail.inventory.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Provides aggregated reporting data for the ADMIN reporting APIs.
 * All queries run as DB-level aggregations — no bulk entity loading.
 */
@Service
public class ReportService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final AuditLogRepository auditLogRepository;

    public ReportService(SaleRepository saleRepository,
                         ProductRepository productRepository,
                         StockAdjustmentRepository stockAdjustmentRepository,
                         StockReceiptRepository stockReceiptRepository,
                         AuditLogRepository auditLogRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
        this.stockReceiptRepository = stockReceiptRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // -----------------------------------------------------------------------
    // Sales summary
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public SalesSummaryResponse getSalesSummary(Instant start, Instant end) {
        BigDecimal totalAmount = saleRepository.sumTotalAmount(start, end);
        Long numberOfSales = saleRepository.countSales(start, end);
        Long totalItemsSold = saleRepository.sumItemsSold(start, end);

        return new SalesSummaryResponse(
                totalAmount != null ? totalAmount : BigDecimal.ZERO,
                numberOfSales != null ? numberOfSales : 0L,
                totalItemsSold != null ? totalItemsSold : 0L
        );
    }

    // -----------------------------------------------------------------------
    // Paginated sales report with optional date filter
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<SaleResponse> getSalesReport(Instant start, Instant end, Pageable pageable) {
        if (start != null && end != null) {
            return saleRepository.findBySaleDateBetween(start, end, pageable)
                    .map(SaleResponse::fromEntity);
        }
        return saleRepository.findAll(pageable).map(SaleResponse::fromEntity);
    }

    // -----------------------------------------------------------------------
    // Top products ranked by quantity sold
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<TopProductResponse> getTopProducts(Pageable pageable) {
        return productRepository.findTopProductsByQuantitySold(pageable)
                .map(row -> new TopProductResponse(
                        (Long) row[0],
                        (String) row[1],
                        (String) row[2],
                        ((Number) row[3]).longValue()
                ));
    }

    // -----------------------------------------------------------------------
    // Inventory report: all active products with low-stock flag
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<InventoryReportResponse> getInventoryReport(Pageable pageable) {
        return productRepository.findAllActiveForReport(pageable)
                .map(this::toInventoryReportResponse);
    }

    private InventoryReportResponse toInventoryReportResponse(Product product) {
        boolean lowStock = product.getCurrentStock() <= product.getReorderLevel();
        return new InventoryReportResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getCurrentStock(),
                product.getReorderLevel(),
                product.getIsActive(),
                lowStock,
                product.getPrice()
        );
    }

    // -----------------------------------------------------------------------
    // Stock movements: receipts (incoming) + adjustments, paginated
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<StockReceiptResponse> getStockReceipts(Instant start, Instant end, Pageable pageable) {
        return stockReceiptRepository.findByDateRange(start, end, pageable)
                .map(StockReceiptResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<StockAdjustmentResponse> getStockAdjustments(Instant start, Instant end, Pageable pageable) {
        return stockAdjustmentRepository.findByDateRange(start, end, pageable)
                .map(StockAdjustmentResponse::fromEntity);
    }

    // -----------------------------------------------------------------------
    // Audit log
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(String eventType, Instant start, Instant end, Pageable pageable) {
        return auditLogRepository.findByFilters(eventType, start, end, pageable)
                .map(AuditLogResponse::fromEntity);
    }
}
