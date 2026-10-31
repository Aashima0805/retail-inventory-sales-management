package com.retail.inventory.repository;

import com.retail.inventory.entity.Category;
import com.retail.inventory.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class ProductRepositoryTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private Category beverages;
    private Category bakery;
    private Product product1;
    private Product product2;
    private Product product3;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
        categoryRepository.deleteAll();

        beverages = categoryRepository.save(new Category(null, "Beverages", "Drinks"));
        bakery = categoryRepository.save(new Category(null, "Bakery", "Baked goods"));

        product1 = new Product(null, "BEV-001", "Mineral Water 1L", "Pure water", beverages,
                new BigDecimal("20.00"), 50, 10, true);
        product2 = new Product(null, "BEV-002", "Orange Juice 1L", "Citrus juice", beverages,
                new BigDecimal("85.00"), 25, 5, false);
        product3 = new Product(null, "BAK-001", "Wheat Bread", "Fresh bread", bakery,
                new BigDecimal("45.00"), 15, 5, true);

        product1 = productRepository.save(product1);
        product2 = productRepository.save(product2);
        product3 = productRepository.save(product3);
    }

    @Test
    void testExistsBySkuIgnoreCase() {
        assertTrue(productRepository.existsBySkuIgnoreCase("bev-001"));
        assertTrue(productRepository.existsBySkuIgnoreCase("BEV-001"));
        assertFalse(productRepository.existsBySkuIgnoreCase("UNKNOWN-SKU"));
    }

    @Test
    void testExistsBySkuIgnoreCaseAndIdNot() {
        // Checking against own ID returns false
        assertFalse(productRepository.existsBySkuIgnoreCaseAndIdNot("bev-001", product1.getId()));

        // Checking against another product's ID returns true if SKU exists on that other product
        assertTrue(productRepository.existsBySkuIgnoreCaseAndIdNot("bev-001", product2.getId()));

        // Checking nonexistent SKU returns false
        assertFalse(productRepository.existsBySkuIgnoreCaseAndIdNot("NEW-SKU", product1.getId()));
    }

    @Test
    void testFindByIdAndIsActive() {
        Optional<Product> activeProduct = productRepository.findByIdAndIsActive(product1.getId(), true);
        assertTrue(activeProduct.isPresent());
        assertEquals("BEV-001", activeProduct.get().getSku());

        Optional<Product> inactiveAsActive = productRepository.findByIdAndIsActive(product2.getId(), true);
        assertFalse(inactiveAsActive.isPresent());

        Optional<Product> inactiveAsInactive = productRepository.findByIdAndIsActive(product2.getId(), false);
        assertTrue(inactiveAsInactive.isPresent());
        assertEquals("BEV-002", inactiveAsInactive.get().getSku());
    }

    @Test
    void testSearchByKeywordMatchingName() {
        Specification<Product> spec = ProductSpecification.filter("Water", null, null);
        Page<Product> result = productRepository.findAll(spec, PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("Mineral Water 1L", result.getContent().get(0).getName());
    }

    @Test
    void testSearchByKeywordMatchingSku() {
        Specification<Product> spec = ProductSpecification.filter("BAK", null, null);
        Page<Product> result = productRepository.findAll(spec, PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("BAK-001", result.getContent().get(0).getSku());
    }

    @Test
    void testSearchByCategoryIdAndActiveStatus() {
        Specification<Product> spec = ProductSpecification.filter(null, beverages.getId(), true);
        Page<Product> result = productRepository.findAll(spec, PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("BEV-001", result.getContent().get(0).getSku());
    }

    @Test
    void testSearchAllActive() {
        Specification<Product> spec = ProductSpecification.filter(null, null, true);
        Page<Product> result = productRepository.findAll(spec, PageRequest.of(0, 10));

        assertEquals(2, result.getTotalElements());
    }
}
