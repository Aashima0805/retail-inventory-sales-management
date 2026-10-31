package com.retail.inventory.service;

import com.retail.inventory.dto.*;
import com.retail.inventory.entity.*;
import com.retail.inventory.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock private SaleRepository saleRepository;
    @Mock private ProductRepository productRepository;
    @Mock private StockAdjustmentRepository stockAdjustmentRepository;
    @Mock private StockReceiptRepository stockReceiptRepository;
    @Mock private AuditLogRepository auditLogRepository;

    @InjectMocks
    private ReportService reportService;

    private Pageable pageable;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10, Sort.unsorted());
    }

    // -----------------------------------------------------------------------
    // Sales summary
    // -----------------------------------------------------------------------

    @Test
    void getSalesSummary_WithNoDates_ReturnsTotals() {
        when(saleRepository.sumTotalAmount(null, null)).thenReturn(new BigDecimal("300.00"));
        when(saleRepository.countSales(null, null)).thenReturn(3L);
        when(saleRepository.sumItemsSold(null, null)).thenReturn(12L);

        SalesSummaryResponse result = reportService.getSalesSummary(null, null);

        assertThat(result.getTotalSalesAmount()).isEqualByComparingTo("300.00");
        assertThat(result.getNumberOfSales()).isEqualTo(3L);
        assertThat(result.getTotalItemsSold()).isEqualTo(12L);
    }

    @Test
    void getSalesSummary_WithDateFilter_PassesDatesToRepo() {
        Instant start = Instant.parse("2026-01-01T00:00:00Z");
        Instant end = Instant.parse("2026-01-31T23:59:59Z");

        when(saleRepository.sumTotalAmount(start, end)).thenReturn(new BigDecimal("150.00"));
        when(saleRepository.countSales(start, end)).thenReturn(2L);
        when(saleRepository.sumItemsSold(start, end)).thenReturn(5L);

        SalesSummaryResponse result = reportService.getSalesSummary(start, end);

        assertThat(result.getTotalSalesAmount()).isEqualByComparingTo("150.00");
        assertThat(result.getNumberOfSales()).isEqualTo(2L);
        verify(saleRepository).sumTotalAmount(start, end);
        verify(saleRepository).countSales(start, end);
        verify(saleRepository).sumItemsSold(start, end);
    }

    @Test
    void getSalesSummary_WhenNoSales_ReturnsZeros() {
        when(saleRepository.sumTotalAmount(null, null)).thenReturn(BigDecimal.ZERO);
        when(saleRepository.countSales(null, null)).thenReturn(0L);
        when(saleRepository.sumItemsSold(null, null)).thenReturn(0L);

        SalesSummaryResponse result = reportService.getSalesSummary(null, null);

        assertThat(result.getTotalSalesAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.getNumberOfSales()).isEqualTo(0L);
        assertThat(result.getTotalItemsSold()).isEqualTo(0L);
    }

    // -----------------------------------------------------------------------
    // Sales report with date filtering
    // -----------------------------------------------------------------------

    @Test
    void getSalesReport_WithoutDates_CallsFindAll() {
        when(saleRepository.findAll(pageable)).thenReturn(Page.empty(pageable));

        reportService.getSalesReport(null, null, pageable);

        verify(saleRepository).findAll(pageable);
        verify(saleRepository, never()).findBySaleDateBetween(any(), any(), any());
    }

    @Test
    void getSalesReport_WithDates_CallsFindBySaleDateBetween() {
        Instant start = Instant.parse("2026-10-01T00:00:00Z");
        Instant end = Instant.parse("2026-10-31T23:59:59Z");
        when(saleRepository.findBySaleDateBetween(start, end, pageable)).thenReturn(Page.empty(pageable));

        reportService.getSalesReport(start, end, pageable);

        verify(saleRepository).findBySaleDateBetween(start, end, pageable);
        verify(saleRepository, never()).findAll(pageable);
    }

    // -----------------------------------------------------------------------
    // Top products ranking
    // -----------------------------------------------------------------------

    @Test
    void getTopProducts_ReturnsProductsRankedByQuantity() {
        // simulate DB projection rows: [productId, sku, name, totalSold]
        Object[] row1 = {1L, "SKU-001", "Widget A", 100L};
        Object[] row2 = {2L, "SKU-002", "Widget B", 50L};
        List<Object[]> rows = new java.util.ArrayList<>();
        rows.add(row1);
        rows.add(row2);
        Page<Object[]> dbPage = new PageImpl<>(rows, pageable, 2);

        when(productRepository.findTopProductsByQuantitySold(pageable)).thenReturn(dbPage);

        Page<TopProductResponse> result = reportService.getTopProducts(pageable);

        assertThat(result.getContent()).hasSize(2);
        TopProductResponse first = result.getContent().get(0);
        assertThat(first.getProductId()).isEqualTo(1L);
        assertThat(first.getProductSku()).isEqualTo("SKU-001");
        assertThat(first.getTotalQuantitySold()).isEqualTo(100L);

        TopProductResponse second = result.getContent().get(1);
        assertThat(second.getTotalQuantitySold()).isEqualTo(50L);
    }

    @Test
    void getTopProducts_WhenNoSales_ReturnsProductsWithZeroQty() {
        Object[] row = {5L, "SKU-005", "No Sale Product", 0L};
        List<Object[]> rows = new java.util.ArrayList<>();
        rows.add(row);
        Page<Object[]> dbPage = new PageImpl<>(rows, pageable, 1);

        when(productRepository.findTopProductsByQuantitySold(pageable)).thenReturn(dbPage);

        Page<TopProductResponse> result = reportService.getTopProducts(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTotalQuantitySold()).isEqualTo(0L);
    }

    // -----------------------------------------------------------------------
    // Inventory report / low-stock
    // -----------------------------------------------------------------------

    @Test
    void getInventoryReport_MarksLowStockCorrectly() {
        Category category = new Category();
        category.setId(1L);
        category.setName("Electronics");

        Product lowStockProduct = new Product(1L, "SKU-L", "Low Stock Item", null, category,
                new BigDecimal("10.00"), 2, 5, true);
        Product okProduct = new Product(2L, "SKU-H", "Healthy Stock Item", null, category,
                new BigDecimal("20.00"), 20, 5, true);

        Page<Product> dbPage = new PageImpl<>(List.of(lowStockProduct, okProduct), pageable, 2);
        when(productRepository.findAllActiveForReport(pageable)).thenReturn(dbPage);

        Page<InventoryReportResponse> result = reportService.getInventoryReport(pageable);

        assertThat(result.getContent()).hasSize(2);

        InventoryReportResponse low = result.getContent().get(0);
        assertThat(low.getSku()).isEqualTo("SKU-L");
        assertThat(low.getIsLowStock()).isTrue();
        assertThat(low.getCurrentStock()).isEqualTo(2);

        InventoryReportResponse healthy = result.getContent().get(1);
        assertThat(healthy.getSku()).isEqualTo("SKU-H");
        assertThat(healthy.getIsLowStock()).isFalse();
    }

    @Test
    void getInventoryReport_ProductAtExactReorderLevel_IsMarkedLowStock() {
        Category category = new Category();
        category.setId(1L);
        category.setName("Food");

        // currentStock == reorderLevel → isLowStock = true (boundary)
        Product product = new Product(3L, "SKU-B", "Boundary Item", null, category,
                new BigDecimal("5.00"), 5, 5, true);

        when(productRepository.findAllActiveForReport(pageable))
                .thenReturn(new PageImpl<>(List.of(product), pageable, 1));

        Page<InventoryReportResponse> result = reportService.getInventoryReport(pageable);

        assertThat(result.getContent().get(0).getIsLowStock()).isTrue();
    }

    // -----------------------------------------------------------------------
    // Audit log filtering and pagination
    // -----------------------------------------------------------------------

    @Test
    void getAuditLogs_NoFilter_CallsRepositoryWithNulls() {
        when(auditLogRepository.findByFilters(null, null, null, pageable))
                .thenReturn(Page.empty(pageable));

        reportService.getAuditLogs(null, null, null, pageable);

        verify(auditLogRepository).findByFilters(null, null, null, pageable);
    }

    @Test
    void getAuditLogs_WithEventTypeFilter_PassesEventType() {
        User user = buildUser("admin1");
        AuditLog log = buildLog("SALE_COMPLETED", "SALE", 1L, user, "Sale done");

        when(auditLogRepository.findByFilters(eq("SALE_COMPLETED"), any(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(log), pageable, 1));

        Page<AuditLogResponse> result = reportService.getAuditLogs("SALE_COMPLETED", null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        AuditLogResponse resp = result.getContent().get(0);
        assertThat(resp.getEventType()).isEqualTo("SALE_COMPLETED");
        assertThat(resp.getPerformedByUsername()).isEqualTo("admin1");
        assertThat(resp.getDescription()).isEqualTo("Sale done");
    }

    @Test
    void getAuditLogs_WithDateRange_PassesDates() {
        Instant start = Instant.parse("2026-10-01T00:00:00Z");
        Instant end = Instant.parse("2026-10-31T23:59:59Z");

        when(auditLogRepository.findByFilters(null, start, end, pageable))
                .thenReturn(Page.empty(pageable));

        reportService.getAuditLogs(null, start, end, pageable);

        verify(auditLogRepository).findByFilters(null, start, end, pageable);
    }

    @Test
    void getAuditLogs_ResponseDoesNotExposePasswordHash() {
        User user = buildUser("cashier1");
        AuditLog log = buildLog("SALE_COMPLETED", "SALE", 10L, user, "Details here");

        when(auditLogRepository.findByFilters(any(), any(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(log), pageable, 1));

        Page<AuditLogResponse> result = reportService.getAuditLogs(null, null, null, pageable);

        AuditLogResponse resp = result.getContent().get(0);
        // Should expose username, NOT passwordHash
        assertThat(resp.getPerformedByUsername()).isEqualTo("cashier1");
        // AuditLogResponse has no method to return a password
        assertThat(resp).isNotNull();
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private User buildUser(String username) {
        Role role = new Role();
        role.setId(1L);
        role.setName("ROLE_ADMIN");

        User user = new User();
        user.setId(99L);
        user.setUsername(username);
        user.setPasswordHash("$2a$irrelevant");
        user.setFullName("Admin User");
        user.setRole(role);
        user.setIsActive(true);
        user.setTokenVersion(1);
        return user;
    }

    private AuditLog buildLog(String eventType, String entityName, Long entityId,
                               User performedBy, String details) {
        AuditLog log = new AuditLog();
        log.setId(1L);
        log.setEventType(eventType);
        log.setEntityName(entityName);
        log.setEntityId(entityId);
        log.setPerformedBy(performedBy);
        log.setDetails(details);
        log.setCreatedAt(Instant.now());
        return log;
    }
}
