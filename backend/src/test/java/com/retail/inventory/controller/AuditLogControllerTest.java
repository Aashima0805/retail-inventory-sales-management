package com.retail.inventory.controller;

import com.retail.inventory.config.SecurityConfig;
import com.retail.inventory.dto.AuditLogResponse;
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

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuditLogController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        GlobalExceptionHandler.class
})
class AuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    // -----------------------------------------------------------------------
    // Authorization tests
    // -----------------------------------------------------------------------

    @Test
    void auditLogs_WhenUnauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void auditLogs_WhenCashier_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isForbidden());
        verify(reportService, never()).getAuditLogs(any(), any(), any(), any());
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void auditLogs_WhenInventoryStaff_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isForbidden());
        verify(reportService, never()).getAuditLogs(any(), any(), any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void auditLogs_WhenAdmin_Returns200() throws Exception {
        when(reportService.getAuditLogs(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    // -----------------------------------------------------------------------
    // Filtering tests
    // -----------------------------------------------------------------------

    @Test
    @WithMockUser(roles = "ADMIN")
    void auditLogs_WithEventTypeFilter_PassesEventTypeToService() throws Exception {
        AuditLogResponse log = new AuditLogResponse(
                1L, "SALE_COMPLETED", "SALE", 1L, "cashier1", "Sale completed", Instant.now());

        when(reportService.getAuditLogs(eq("SALE_COMPLETED"), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(log)));

        mockMvc.perform(get("/api/v1/audit-logs")
                        .param("eventType", "SALE_COMPLETED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].eventType").value("SALE_COMPLETED"))
                .andExpect(jsonPath("$.content[0].performedByUsername").value("cashier1"));

        verify(reportService).getAuditLogs(eq("SALE_COMPLETED"), any(), any(), any(Pageable.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void auditLogs_WithDateRange_PassesDatesToService() throws Exception {
        when(reportService.getAuditLogs(any(), any(Instant.class), any(Instant.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/audit-logs")
                        .param("startDate", "2026-10-01T00:00:00Z")
                        .param("endDate", "2026-10-31T23:59:59Z"))
                .andExpect(status().isOk());

        verify(reportService).getAuditLogs(isNull(), any(Instant.class), any(Instant.class), any(Pageable.class));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void auditLogs_Pagination_Works() throws Exception {
        List<AuditLogResponse> logs = List.of(
                new AuditLogResponse(1L, "STOCK_ADJUSTMENT", "STOCK_ADJUSTMENT", 1L, "admin1", "Details", Instant.now()),
                new AuditLogResponse(2L, "SALE_COMPLETED", "SALE", 2L, "cashier1", "Sale done", Instant.now())
        );
        when(reportService.getAuditLogs(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(logs));

        mockMvc.perform(get("/api/v1/audit-logs")
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void auditLogs_ResponseContainsExpectedFields() throws Exception {
        Instant ts = Instant.parse("2026-10-31T10:00:00Z");
        AuditLogResponse log = new AuditLogResponse(
                42L, "STOCK_INCOMING", "STOCK_RECEIPT", 7L, "inventory1",
                "Received 100 units from Supplier X", ts);

        when(reportService.getAuditLogs(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(log)));

        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(42))
                .andExpect(jsonPath("$.content[0].eventType").value("STOCK_INCOMING"))
                .andExpect(jsonPath("$.content[0].entityName").value("STOCK_RECEIPT"))
                .andExpect(jsonPath("$.content[0].entityId").value(7))
                .andExpect(jsonPath("$.content[0].performedByUsername").value("inventory1"))
                .andExpect(jsonPath("$.content[0].description").value("Received 100 units from Supplier X"))
                .andExpect(jsonPath("$.content[0].timestamp").exists())
                // Must NOT expose a passwordHash field
                .andExpect(jsonPath("$.content[0].passwordHash").doesNotExist());
    }
}
