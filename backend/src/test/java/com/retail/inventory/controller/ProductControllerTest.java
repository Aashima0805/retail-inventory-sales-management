package com.retail.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retail.inventory.config.SecurityConfig;
import com.retail.inventory.dto.CategoryResponse;
import com.retail.inventory.dto.ProductRequest;
import com.retail.inventory.dto.ProductResponse;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.GlobalExceptionHandler;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.JwtAuthenticationEntryPoint;
import com.retail.inventory.security.JwtAuthenticationFilter;
import com.retail.inventory.security.JwtTokenProvider;
import com.retail.inventory.service.ProductService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ProductController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        GlobalExceptionHandler.class
})
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    private ProductResponse sampleResponse() {
        return new ProductResponse(
                10L,
                "BEV-001",
                "Mineral Water",
                "Pure spring water",
                new CategoryResponse(1L, "Beverages", "Drinks"),
                new BigDecimal("20.00"),
                50,
                10,
                true,
                Instant.now(),
                Instant.now()
        );
    }

    @Test
    void searchProducts_WhenUnauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void searchProducts_WhenCashier_ShouldReturn200() throws Exception {
        when(productService.searchProducts(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse())));

        mockMvc.perform(get("/api/v1/products")
                        .param("keyword", "water")
                        .param("categoryId", "1")
                        .param("isActive", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].sku").value("BEV-001"))
                .andExpect(jsonPath("$.content[0].price").value(20.00));
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void searchProducts_WhenInventoryStaff_ShouldReturn200() throws Exception {
        when(productService.searchProducts(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleResponse())));

        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getProductById_WhenFound_ShouldReturn200() throws Exception {
        when(productService.getProductById(10L)).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/products/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.sku").value("BEV-001"));
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getProductById_WhenNotFound_ShouldReturn404() throws Exception {
        when(productService.getProductById(99L))
                .thenThrow(new ResourceNotFoundException("Product not found with id: 99"));

        mockMvc.perform(get("/api/v1/products/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Product not found with id: 99"));
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void createProduct_WhenNotAdmin_ShouldReturn403() throws Exception {
        ProductRequest request = new ProductRequest("BEV-002", "Soda", "Drinks", 1L,
                new BigDecimal("25.00"), 5);

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(productService, never()).createProduct(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_WhenAdmin_ShouldReturn201() throws Exception {
        ProductRequest request = new ProductRequest("BEV-002", "Soda", "Drinks", 1L,
                new BigDecimal("25.00"), 5);
        when(productService.createProduct(any(ProductRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sku").value("BEV-001"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_WhenInvalidFields_ShouldReturn400() throws Exception {
        // Missing SKU, negative price, null categoryId, negative reorderLevel
        ProductRequest request = new ProductRequest("", "Name", "Desc", null,
                new BigDecimal("-5.00"), -1);

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.sku").exists())
                .andExpect(jsonPath("$.fieldErrors.categoryId").exists())
                .andExpect(jsonPath("$.fieldErrors.price").exists())
                .andExpect(jsonPath("$.fieldErrors.reorderLevel").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createProduct_WhenDuplicateSku_ShouldReturn409() throws Exception {
        ProductRequest request = new ProductRequest("BEV-001", "Soda", "Drinks", 1L,
                new BigDecimal("25.00"), 5);
        when(productService.createProduct(any(ProductRequest.class)))
                .thenThrow(new DuplicateResourceException("Product with SKU 'BEV-001' already exists"));

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.title").value("Conflict"))
                .andExpect(jsonPath("$.detail").value("Product with SKU 'BEV-001' already exists"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateProduct_WhenAdmin_ShouldReturn200() throws Exception {
        ProductRequest request = new ProductRequest("BEV-001", "Soda Mod", "Drinks", 1L,
                new BigDecimal("25.00"), 5);
        when(productService.updateProduct(eq(10L), any(ProductRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(put("/api/v1/products/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sku").value("BEV-001"));
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void updateProduct_WhenNotAdmin_ShouldReturn403() throws Exception {
        ProductRequest request = new ProductRequest("BEV-001", "Soda Mod", "Drinks", 1L,
                new BigDecimal("25.00"), 5);

        mockMvc.perform(put("/api/v1/products/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deactivateProduct_WhenAdmin_ShouldReturn204() throws Exception {
        doNothing().when(productService).deactivateProduct(10L);

        mockMvc.perform(patch("/api/v1/products/10/deactivate"))
                .andExpect(status().isNoContent());

        verify(productService).deactivateProduct(10L);
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void deactivateProduct_WhenNotAdmin_ShouldReturn403() throws Exception {
        mockMvc.perform(patch("/api/v1/products/10/deactivate"))
                .andExpect(status().isForbidden());

        verify(productService, never()).deactivateProduct(any());
    }
}
