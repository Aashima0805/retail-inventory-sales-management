package com.retail.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retail.inventory.config.SecurityConfig;
import com.retail.inventory.dto.*;
import com.retail.inventory.exception.GlobalExceptionHandler;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.JwtAuthenticationEntryPoint;
import com.retail.inventory.security.JwtAuthenticationFilter;
import com.retail.inventory.security.JwtTokenProvider;
import com.retail.inventory.service.SalesService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = SalesController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        GlobalExceptionHandler.class
})
class SalesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SalesService salesService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private SaleResponse sampleResponse() {
        return new SaleResponse(
                100L,
                "SALE-20261031-1001",
                2L,
                "cashier1",
                "Alice",
                Instant.now(),
                new BigDecimal("40.00"),
                List.of(new SaleItemResponse(1L, 10L, "BEV-001", "Mineral Water 1L", 2, new BigDecimal("20.00"), new BigDecimal("40.00"))),
                Instant.now()
        );
    }

    @Test
    void checkout_WhenUnauthenticated_ShouldReturn401() throws Exception {
        SaleRequest request = new SaleRequest(List.of(new SaleItemRequest(10L, 2)));

        mockMvc.perform(post("/api/v1/sales/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void checkout_WhenInventoryStaff_ShouldReturn403() throws Exception {
        SaleRequest request = new SaleRequest(List.of(new SaleItemRequest(10L, 2)));

        mockMvc.perform(post("/api/v1/sales/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(salesService, never()).checkout(any(), any());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void checkout_WhenCashier_ShouldReturn201() throws Exception {
        SaleRequest request = new SaleRequest(List.of(new SaleItemRequest(10L, 2)));
        when(salesService.checkout(any(), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/sales/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.receiptNumber").value("SALE-20261031-1001"))
                .andExpect(jsonPath("$.totalAmount").value(40.00));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void checkout_WhenAdmin_ShouldReturn201() throws Exception {
        SaleRequest request = new SaleRequest(List.of(new SaleItemRequest(10L, 2)));
        when(salesService.checkout(any(), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/sales/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void checkout_WhenInvalidRequest_ShouldReturn400() throws Exception {
        // empty items
        SaleRequest request = new SaleRequest(List.of());

        mockMvc.perform(post("/api/v1/sales/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.items").exists());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getSales_WhenCashier_ShouldReturn200() throws Exception {
        when(salesService.getSales(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse())));

        mockMvc.perform(get("/api/v1/sales"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].receiptNumber").value("SALE-20261031-1001"));
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void getSales_WhenInventoryStaff_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/sales"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getSaleById_WhenOtherCashierSale_ShouldReturn403() throws Exception {
        when(salesService.getSaleById(eq(99L), any()))
                .thenThrow(new AccessDeniedException("You do not have permission to view this sale"));

        mockMvc.perform(get("/api/v1/sales/99"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getSaleById_WhenNotFound_ShouldReturn404() throws Exception {
        when(salesService.getSaleById(eq(999L), any()))
                .thenThrow(new ResourceNotFoundException("Sale not found with id: 999"));

        mockMvc.perform(get("/api/v1/sales/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
