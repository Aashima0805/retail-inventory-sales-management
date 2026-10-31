package com.retail.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retail.inventory.config.SecurityConfig;
import com.retail.inventory.dto.CategoryRequest;
import com.retail.inventory.dto.CategoryResponse;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.GlobalExceptionHandler;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.JwtAuthenticationEntryPoint;
import com.retail.inventory.security.JwtAuthenticationFilter;
import com.retail.inventory.security.JwtTokenProvider;
import com.retail.inventory.service.CategoryService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = CategoryController.class)
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        GlobalExceptionHandler.class
})
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CategoryService categoryService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserRepository userRepository;

    @Test
    void getCategories_WhenUnauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getCategories_WhenAuthenticatedAsCashier_ShouldReturn200() throws Exception {
        when(categoryService.getCategories(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(new CategoryResponse(1L, "Beverages", "Drinks"))));

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Beverages"));
    }

    @Test
    @WithMockUser(roles = "INVENTORY_STAFF")
    void getCategories_WhenAuthenticatedAsInventoryStaff_ShouldReturn200() throws Exception {
        when(categoryService.getCategories(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(new CategoryResponse(1L, "Beverages", "Drinks"))));

        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getCategoryById_WhenFound_ShouldReturn200() throws Exception {
        when(categoryService.getCategoryById(1L))
                .thenReturn(new CategoryResponse(1L, "Beverages", "Drinks"));

        mockMvc.perform(get("/api/v1/categories/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Beverages"));
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void getCategoryById_WhenNotFound_ShouldReturn404() throws Exception {
        when(categoryService.getCategoryById(99L))
                .thenThrow(new ResourceNotFoundException("Category not found with id: 99"));

        mockMvc.perform(get("/api/v1/categories/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("Category not found with id: 99"));
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void createCategory_WhenNotAdmin_ShouldReturn403() throws Exception {
        CategoryRequest request = new CategoryRequest("Snacks", "Chips");

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());

        verify(categoryService, never()).createCategory(any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createCategory_WhenAdmin_ShouldReturn201() throws Exception {
        CategoryRequest request = new CategoryRequest("Snacks", "Chips");
        CategoryResponse response = new CategoryResponse(5L, "Snacks", "Chips");
        when(categoryService.createCategory(any(CategoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.name").value("Snacks"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createCategory_WhenInvalidRequest_ShouldReturn400() throws Exception {
        CategoryRequest request = new CategoryRequest("", "Empty name");

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createCategory_WhenDuplicateName_ShouldReturn409() throws Exception {
        CategoryRequest request = new CategoryRequest("Beverages", "Drinks");
        when(categoryService.createCategory(any(CategoryRequest.class)))
                .thenThrow(new DuplicateResourceException("Category with name 'Beverages' already exists"));

        mockMvc.perform(post("/api/v1/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.title").value("Conflict"))
                .andExpect(jsonPath("$.detail").value("Category with name 'Beverages' already exists"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateCategory_WhenAdmin_ShouldReturn200() throws Exception {
        CategoryRequest request = new CategoryRequest("Updated Beverages", "Drinks");
        CategoryResponse response = new CategoryResponse(1L, "Updated Beverages", "Drinks");
        when(categoryService.updateCategory(eq(1L), any(CategoryRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Beverages"));
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void updateCategory_WhenNotAdmin_ShouldReturn403() throws Exception {
        CategoryRequest request = new CategoryRequest("Updated Beverages", "Drinks");

        mockMvc.perform(put("/api/v1/categories/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
