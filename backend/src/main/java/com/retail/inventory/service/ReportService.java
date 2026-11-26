package com.retail.inventory.service;

import com.retail.inventory.dto.*;
import com.retail.inventory.entity.Product;
import com.retail.inventory.entity.Sale;
import com.retail.inventory.entity.StockAdjustment;
import com.retail.inventory.entity.StockReceipt;
import com.retail.inventory.repository.*;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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
        long lowStockCount = productRepository.countLowStockProducts();

        return new SalesSummaryResponse(
                totalAmount != null ? totalAmount : BigDecimal.ZERO,
                numberOfSales != null ? numberOfSales : 0L,
                totalItemsSold != null ? totalItemsSold : 0L,
                lowStockCount
        );
    }

    // -----------------------------------------------------------------------
    // Paginated sales report with optional date, cashier, and receipt filters
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<SaleResponse> getSalesReport(Instant start, Instant end, Pageable pageable) {
        if (start != null && end != null) {
            return saleRepository.findBySaleDateBetween(start, end, pageable)
                    .map(SaleResponse::fromEntity);
        }
        return saleRepository.findAll(pageable).map(SaleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<SaleResponse> getSalesReport(Instant start, Instant end, Long cashierId, String receiptNumber, Pageable pageable) {
        if (cashierId == null && (receiptNumber == null || receiptNumber.isBlank())) {
            return getSalesReport(start, end, pageable);
        }

        Pageable sorted = pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                        Sort.by(Sort.Direction.DESC, "saleDate"));

        Specification<Sale> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("saleDate"), start));
            }
            if (end != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("saleDate"), end));
            }
            if (cashierId != null) {
                predicates.add(cb.equal(root.get("cashier").get("id"), cashierId));
            }
            if (receiptNumber != null && !receiptNumber.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("receiptNumber")),
                        "%" + receiptNumber.trim().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return saleRepository.findAll(spec, sorted).map(SaleResponse::fromEntity);
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
        return getStockReceipts(start, end, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<StockReceiptResponse> getStockReceipts(Instant start, Instant end, Long supplierId, Pageable pageable) {
        Pageable sorted = pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                        Sort.by(Sort.Direction.DESC, "receivedDate"));
        Specification<StockReceipt> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("receivedDate"), start));
            }
            if (end != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("receivedDate"), end));
            }
            if (supplierId != null) {
                predicates.add(cb.equal(root.get("supplier").get("id"), supplierId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return stockReceiptRepository.findAll(spec, sorted)
                .map(StockReceiptResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<StockAdjustmentResponse> getStockAdjustments(Instant start, Instant end, Pageable pageable) {
        Pageable sorted = pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                        Sort.by(Sort.Direction.DESC, "adjustmentDate"));
        Specification<StockAdjustment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("adjustmentDate"), start));
            }
            if (end != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("adjustmentDate"), end));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return stockAdjustmentRepository.findAll(spec, sorted)
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
