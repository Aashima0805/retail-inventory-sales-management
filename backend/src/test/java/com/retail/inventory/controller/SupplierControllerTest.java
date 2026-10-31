package com.retail.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retail.inventory.config.SecurityConfig;
import com.retail.inventory.dto.SupplierRequest;
import com.retail.inventory.dto.SupplierResponse;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.GlobalExceptionHandler;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.JwtAuthenticationEntryPoint;
import com.retail.inventory.security.JwtAuthenticationFilter;
import com.retail.inventory.security.JwtTokenProvider;
import com.retail.inventory.service.SupplierService;
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

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = SupplierController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        GlobalExceptionHandler.class
})
class SupplierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SupplierService supplierService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private SupplierResponse sampleResponse() {
        return new SupplierResponse(
                1L,
                "Apex Food Distributors",
                "Rajesh",
                "12345",
                "orders@apex.com",
                "Address 1",
                true,
                Instant.now(),
                Instant.now()
        );
    }

    @Test
    void getSuppliers_WhenUnauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getSuppliers_WhenCashier_ShouldReturn200() throws Exception {
        when(supplierService.searchSuppliers(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse())));

        mockMvc.perform(get("/api/v1/suppliers")
                        .param("keyword", "Apex")
                        .param("isActive", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Apex Food Distributors"));
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void getSuppliers_WhenInventoryStaff_ShouldReturn200() throws Exception {
        when(supplierService.searchSuppliers(any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse())));

        mockMvc.perform(get("/api/v1/suppliers"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getSupplierById_WhenFound_ShouldReturn200() throws Exception {
        when(supplierService.getSupplierById(1L)).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/suppliers/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Apex Food Distributors"));
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getSupplierById_WhenNotFound_ShouldReturn404() throws Exception {
        when(supplierService.getSupplierById(99L))
                .thenThrow(new ResourceNotFoundException("Supplier not found with id: 99"));

        mockMvc.perform(get("/api/v1/suppliers/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void createSupplier_WhenNotAdmin_ShouldReturn403() throws Exception {
        SupplierRequest request = new SupplierRequest("Daily Fresh", "Sunita", "12345", "a@a.com", "Addr");

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(supplierService, never()).createSupplier(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createSupplier_WhenAdmin_ShouldReturn201() throws Exception {
        SupplierRequest request = new SupplierRequest("Daily Fresh", "Sunita", "12345", "a@a.com", "Addr");
        when(supplierService.createSupplier(any(SupplierRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Apex Food Distributors"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createSupplier_WhenInvalidRequest_ShouldReturn400() throws Exception {
        SupplierRequest request = new SupplierRequest("", "Sunita", "12345", "not-an-email", "Addr");

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createSupplier_WhenDuplicateName_ShouldReturn409() throws Exception {
        SupplierRequest request = new SupplierRequest("Apex Food Distributors", "Rajesh", "12345", "a@a.com", "Addr");
        when(supplierService.createSupplier(any(SupplierRequest.class)))
                .thenThrow(new DuplicateResourceException("Supplier with name 'Apex Food Distributors' already exists"));

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.detail").value("Supplier with name 'Apex Food Distributors' already exists"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateSupplier_WhenAdmin_ShouldReturn200() throws Exception {
        SupplierRequest request = new SupplierRequest("Apex Updated", "Rajesh", "12345", "a@a.com", "Addr");
        when(supplierService.updateSupplier(eq(1L), any(SupplierRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(put("/api/v1/suppliers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void updateSupplier_WhenNotAdmin_ShouldReturn403() throws Exception {
        SupplierRequest request = new SupplierRequest("Apex Updated", "Rajesh", "12345", "a@a.com", "Addr");

        mockMvc.perform(put("/api/v1/suppliers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deactivateSupplier_WhenAdmin_ShouldReturn204() throws Exception {
        doNothing().when(supplierService).deactivateSupplier(1L);

        mockMvc.perform(patch("/api/v1/suppliers/1/deactivate"))
                .andExpect(status().isNoContent());

        verify(supplierService).deactivateSupplier(1L);
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void deactivateSupplier_WhenNotAdmin_ShouldReturn403() throws Exception {
        mockMvc.perform(patch("/api/v1/suppliers/1/deactivate"))
                .andExpect(status().isForbidden());

        verify(supplierService, never()).deactivateSupplier(any());
    }
}
