package com.retail.inventory.repository;

import com.retail.inventory.entity.Category;
import com.retail.inventory.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class ProductRepositoryLowStockTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        Category category = categoryRepository.save(new Category(null, "Pantry", "Staples"));

        // Product 1: Low stock (current_stock 3 <= reorder_level 5), active
        productRepository.save(new Product(null, "LOW-001", "Flour 1kg", "Flour", category,
                new BigDecimal("50.00"), 3, 5, true));

        // Product 2: Exact reorder boundary (current_stock 5 <= reorder_level 5), active
        productRepository.save(new Product(null, "LOW-002", "Sugar 1kg", "Sugar", category,
                new BigDecimal("40.00"), 5, 5, true));

        // Product 3: Sufficient stock (current_stock 20 > reorder_level 5), active
        productRepository.save(new Product(null, "HIGH-001", "Rice 5kg", "Rice", category,
                new BigDecimal("250.00"), 20, 5, true));

        // Product 4: Low stock but INACTIVE (should not appear)
        productRepository.save(new Product(null, "INACT-001", "Old Oats", "Oats", category,
                new BigDecimal("30.00"), 1, 5, false));
    }

    @Test
    void testFindLowStockProducts() {
        Page<Product> lowStockPage = productRepository.findLowStockProducts(PageRequest.of(0, 10));

        assertEquals(2, lowStockPage.getTotalElements());
        assertTrue(lowStockPage.getContent().stream().anyMatch(p -> p.getSku().equals("LOW-001")));
        assertTrue(lowStockPage.getContent().stream().anyMatch(p -> p.getSku().equals("LOW-002")));
        assertFalse(lowStockPage.getContent().stream().anyMatch(p -> p.getSku().equals("HIGH-001")));
        assertFalse(lowStockPage.getContent().stream().anyMatch(p -> p.getSku().equals("INACT-001")));
    }
}
