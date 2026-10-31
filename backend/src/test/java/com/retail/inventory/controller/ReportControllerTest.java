package com.retail.inventory.controller;

import com.retail.inventory.config.SecurityConfig;
import com.retail.inventory.dto.*;
import com.retail.inventory.exception.GlobalExceptionHandler;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.JwtAuthenticationEntryPoint;
import com.retail.inventory.security.JwtAuthenticationFilter;
import com.retail.inventory.security.JwtTokenProvider;
import com.retail.inventory.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ReportController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        GlobalExceptionHandler.class
})
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    // -----------------------------------------------------------------------
    // Authorization: sales-summary
    // -----------------------------------------------------------------------

    @Test
    void salesSummary_WhenUnauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/reports/sales-summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void salesSummary_WhenCashier_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/sales-summary"))
                .andExpect(status().isForbidden());
        verify(reportService, never()).getSalesSummary(any(), any());
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void salesSummary_WhenInventoryStaff_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/sales-summary"))
                .andExpect(status().isForbidden());
        verify(reportService, never()).getSalesSummary(any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void salesSummary_WhenAdmin_Returns200WithBody() throws Exception {
        SalesSummaryResponse summary = new SalesSummaryResponse(new BigDecimal("500.00"), 5L, 20L);
        when(reportService.getSalesSummary(any(), any())).thenReturn(summary);

        mockMvc.perform(get("/api/v1/reports/sales-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSalesAmount").value(500.00))
                .andExpect(jsonPath("$.numberOfSales").value(5))
                .andExpect(jsonPath("$.totalItemsSold").value(20));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void salesSummary_WithDateFilter_PassesDatesToService() throws Exception {
        SalesSummaryResponse summary = new SalesSummaryResponse(new BigDecimal("100.00"), 1L, 3L);
        when(reportService.getSalesSummary(any(Instant.class), any(Instant.class))).thenReturn(summary);

        mockMvc.perform(get("/api/v1/reports/sales-summary")
                        .param("startDate", "2026-10-01T00:00:00Z")
                        .param("endDate", "2026-10-31T23:59:59Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.numberOfSales").value(1));

        verify(reportService).getSalesSummary(any(Instant.class), any(Instant.class));
    }

    // -----------------------------------------------------------------------
    // Authorization: sales report
    // -----------------------------------------------------------------------

    @Test
    void salesReport_WhenUnauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/reports/sales"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void salesReport_WhenCashier_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/sales"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void salesReport_WhenAdmin_Returns200() throws Exception {
        when(reportService.getSalesReport(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/reports/sales"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void salesReport_WithDateFilter_Returns200() throws Exception {
        when(reportService.getSalesReport(any(Instant.class), any(Instant.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/reports/sales")
                        .param("startDate", "2026-01-01T00:00:00Z")
                        .param("endDate", "2026-01-31T23:59:59Z"))
                .andExpect(status().isOk());
    }

    // -----------------------------------------------------------------------
    // Authorization: top-products
    // -----------------------------------------------------------------------

    @Test
    void topProducts_WhenUnauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/reports/top-products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void topProducts_WhenCashier_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/top-products"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void topProducts_WhenAdmin_Returns200WithRanking() throws Exception {
        List<TopProductResponse> products = List.of(
                new TopProductResponse(1L, "SKU-A", "Best Seller", 200L),
                new TopProductResponse(2L, "SKU-B", "Second Best", 100L)
        );
        when(reportService.getTopProducts(any(Pageable.class)))
                .thenReturn(new PageImpl<>(products));

        mockMvc.perform(get("/api/v1/reports/top-products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].productSku").value("SKU-A"))
                .andExpect(jsonPath("$.content[0].totalQuantitySold").value(200))
                .andExpect(jsonPath("$.content[1].totalQuantitySold").value(100));
    }

    // -----------------------------------------------------------------------
    // Authorization: inventory
    // -----------------------------------------------------------------------

    @Test
    void inventory_WhenUnauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/reports/inventory"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void inventory_WhenInventoryStaff_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/inventory"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void inventory_WhenAdmin_Returns200WithLowStockFlag() throws Exception {
        List<InventoryReportResponse> items = List.of(
                new InventoryReportResponse(1L, "SKU-X", "Low Stock Item",
                        2, 5, true, true, new BigDecimal("9.99")),
                new InventoryReportResponse(2L, "SKU-Y", "In Stock Item",
                        50, 5, true, false, new BigDecimal("19.99"))
        );
        when(reportService.getInventoryReport(any(Pageable.class)))
                .thenReturn(new PageImpl<>(items));

        mockMvc.perform(get("/api/v1/reports/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].isLowStock").value(true))
                .andExpect(jsonPath("$.content[1].isLowStock").value(false));
    }

    // -----------------------------------------------------------------------
    // Authorization: stock-movements
    // -----------------------------------------------------------------------

    @Test
    void stockMovements_WhenUnauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/reports/stock-movements"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void stockMovements_WhenCashier_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reports/stock-movements"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void stockMovements_DefaultType_Returns200() throws Exception {
        when(reportService.getStockReceipts(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/reports/stock-movements"))
                .andExpect(status().isOk());

        verify(reportService).getStockReceipts(any(), any(), any(Pageable.class));
        verify(reportService, never()).getStockAdjustments(any(), any(), any(Pageable.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void stockMovements_AdjustmentsType_Returns200() throws Exception {
        when(reportService.getStockAdjustments(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/reports/stock-movements")
                        .param("type", "ADJUSTMENTS"))
                .andExpect(status().isOk());

        verify(reportService).getStockAdjustments(any(), any(), any(Pageable.class));
        verify(reportService, never()).getStockReceipts(any(), any(), any(Pageable.class));
    }
}
