package com.retail.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retail.inventory.config.SecurityConfig;
import com.retail.inventory.dto.*;
import com.retail.inventory.exception.GlobalExceptionHandler;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.CustomUserDetails;
import com.retail.inventory.security.JwtAuthenticationEntryPoint;
import com.retail.inventory.security.JwtAuthenticationFilter;
import com.retail.inventory.security.JwtTokenProvider;
import com.retail.inventory.service.InventoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = InventoryController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        GlobalExceptionHandler.class
})
class InventoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventoryService inventoryService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    void recordIncomingStock_WhenUnauthenticated_ShouldReturn401() throws Exception {
        StockReceiptRequest request = new StockReceiptRequest(1L, "Notes",
                List.of(new StockReceiptItemRequest(10L, 20, new BigDecimal("10.00"))));

        mockMvc.perform(post("/api/v1/inventory/receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void recordIncomingStock_WhenCashier_ShouldReturn403() throws Exception {
        StockReceiptRequest request = new StockReceiptRequest(1L, "Notes",
                List.of(new StockReceiptItemRequest(10L, 20, new BigDecimal("10.00"))));

        mockMvc.perform(post("/api/v1/inventory/receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(inventoryService, never()).recordIncomingStock(any(), any());
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void recordIncomingStock_WhenInventoryStaff_ShouldReturn201() throws Exception {
        StockReceiptRequest request = new StockReceiptRequest(1L, "Notes",
                List.of(new StockReceiptItemRequest(10L, 20, new BigDecimal("10.00"))));

        StockReceiptResponse response = new StockReceiptResponse(
                100L, "REC-20261031-0001", 1L, "Apex", "inventory1",
                Instant.now(), "Notes", 20, List.of(), Instant.now());

        when(inventoryService.recordIncomingStock(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/inventory/receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.receiptReference").value("REC-20261031-0001"))
                .andExpect(jsonPath("$.totalQuantityReceived").value(20));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void recordIncomingStock_WhenAdmin_ShouldReturn201() throws Exception {
        StockReceiptRequest request = new StockReceiptRequest(1L, "Notes",
                List.of(new StockReceiptItemRequest(10L, 20, new BigDecimal("10.00"))));

        StockReceiptResponse response = new StockReceiptResponse(
                100L, "REC-20261031-0001", 1L, "Apex", "admin",
                Instant.now(), "Notes", 20, List.of(), Instant.now());

        when(inventoryService.recordIncomingStock(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/inventory/receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void recordIncomingStock_WhenInvalidBody_ShouldReturn400() throws Exception {
        // null supplier, empty items
        StockReceiptRequest request = new StockReceiptRequest(null, "Notes", List.of());

        mockMvc.perform(post("/api/v1/inventory/receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.supplierId").exists())
                .andExpect(jsonPath("$.fieldErrors.items").exists());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void adjustStock_WhenCashier_ShouldReturn403() throws Exception {
        StockAdjustmentRequest request = new StockAdjustmentRequest(10L, -5, "Damaged");

        mockMvc.perform(post("/api/v1/inventory/adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void adjustStock_WhenInventoryStaff_ShouldReturn403() throws Exception {
        StockAdjustmentRequest request = new StockAdjustmentRequest(10L, -5, "Damaged");

        mockMvc.perform(post("/api/v1/inventory/adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adjustStock_WhenAdmin_ShouldReturn201() throws Exception {
        StockAdjustmentRequest request = new StockAdjustmentRequest(10L, -5, "Damaged");
        StockAdjustmentResponse response = new StockAdjustmentResponse(
                200L, 10L, "BEV-001", "Mineral Water", "admin", -5, 50, 45, "Damaged", Instant.now());

        when(inventoryService.adjustStock(any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/inventory/adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.previousStock").value(50))
                .andExpect(jsonPath("$.newStock").value(45));
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getStockListing_WhenCashier_ShouldReturn200() throws Exception {
        when(inventoryService.getStockListing(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/inventory/stock"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getLowStockProducts_WhenCashier_ShouldReturn200() throws Exception {
        when(inventoryService.getLowStockProducts(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/inventory/low-stock"))
                .andExpect(status().isOk());
    }
}
