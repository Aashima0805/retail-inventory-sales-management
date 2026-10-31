package com.retail.inventory.service;

import com.retail.inventory.dto.ProductRequest;
import com.retail.inventory.dto.ProductResponse;
import com.retail.inventory.entity.Category;
import com.retail.inventory.entity.Product;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.CategoryRepository;
import com.retail.inventory.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private ProductService productService;

    private Category category;
    private Product product;

    @BeforeEach
    void setUp() {
        category = new Category(1L, "Beverages", "Drinks");
        product = new Product(10L, "BEV-001", "Mineral Water", "Pure water", category,
                new BigDecimal("20.00"), 50, 10, true);
    }

    @Test
    void searchProducts_ShouldReturnPagedResponses() {
        Page<Product> page = new PageImpl<>(List.of(product));
        when(productRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        Page<ProductResponse> result = productService.searchProducts("Water", 1L, true, PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("BEV-001", result.getContent().get(0).getSku());
    }

    @Test
    void getProductById_WhenFound_ShouldReturnResponse() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        ProductResponse response = productService.getProductById(10L);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("BEV-001", response.getSku());
    }

    @Test
    void getProductById_WhenNotFound_ShouldThrowException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.getProductById(99L));
    }

    @Test
    void createProduct_WhenValid_ShouldSaveAndReturnResponse() {
        ProductRequest request = new ProductRequest("BEV-002", "Soda", "Carbonated drink",
                1L, new BigDecimal("35.00"), 15);

        when(productRepository.existsBySkuIgnoreCase("BEV-002")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product p = invocation.getArgument(0);
            p.setId(11L);
            return p;
        });

        ProductResponse response = productService.createProduct(request);

        assertNotNull(response);
        assertEquals(11L, response.getId());
        assertEquals("BEV-002", response.getSku());
        assertEquals(0, response.getCurrentStock());
        assertTrue(response.getIsActive());

        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(captor.capture());
        assertEquals(0, captor.getValue().getCurrentStock(), "New product must have stock 0");
        assertTrue(captor.getValue().getIsActive(), "New product must be active");
    }

    @Test
    void createProduct_WhenDuplicateSku_ShouldThrowDuplicateResourceException() {
        ProductRequest request = new ProductRequest("BEV-001", "Water", "Desc",
                1L, new BigDecimal("20.00"), 10);
        when(productRepository.existsBySkuIgnoreCase("BEV-001")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void createProduct_WhenCategoryNotFound_ShouldThrowResourceNotFoundException() {
        ProductRequest request = new ProductRequest("BEV-003", "Water", "Desc",
                99L, new BigDecimal("20.00"), 10);
        when(productRepository.existsBySkuIgnoreCase("BEV-003")).thenReturn(false);
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.createProduct(request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void updateProduct_WhenValid_ShouldPreserveStockAndActiveStatus() {
        ProductRequest request = new ProductRequest("BEV-001-MOD", "Updated Water", "Updated Desc",
                1L, new BigDecimal("22.50"), 12);

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(productRepository.existsBySkuIgnoreCaseAndIdNot("BEV-001-MOD", 10L)).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductResponse response = productService.updateProduct(10L, request);

        assertNotNull(response);
        assertEquals("BEV-001-MOD", response.getSku());
        assertEquals(50, response.getCurrentStock(), "Stock must remain unchanged");
        assertTrue(response.getIsActive(), "Active status must remain unchanged");
    }

    @Test
    void updateProduct_WhenDuplicateSkuOnOtherProduct_ShouldThrowDuplicateResourceException() {
        ProductRequest request = new ProductRequest("EXISTING-SKU", "Name", "Desc",
                1L, new BigDecimal("20.00"), 10);
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(productRepository.existsBySkuIgnoreCaseAndIdNot("EXISTING-SKU", 10L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> productService.updateProduct(10L, request));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void deactivateProduct_ShouldSetIsActiveToFalse() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        productService.deactivateProduct(10L);

        assertFalse(product.getIsActive(), "Product isActive must be set to false");
        verify(productRepository).save(product);
        verify(productRepository, never()).delete(any(Product.class));
    }

    @Test
    void deactivateProduct_WhenProductNotFound_ShouldThrowException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.deactivateProduct(99L));
    }
}
