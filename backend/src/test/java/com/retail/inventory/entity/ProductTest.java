package com.retail.inventory.entity;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class ProductTest {

    @Test
    void testPrePersistDefaults() {
        Category category = new Category(1L, "Beverages", "Drinks");
        Product product = new Product();
        product.setSku("BEV-100");
        product.setName("Sparkling Water");
        product.setCategory(category);
        product.setPrice(new BigDecimal("25.50"));

        assertNull(product.getCreatedAt());
        assertNull(product.getUpdatedAt());

        product.prePersist();

        assertNotNull(product.getCreatedAt());
        assertNotNull(product.getUpdatedAt());
        assertEquals(0, product.getCurrentStock());
        assertEquals(5, product.getReorderLevel());
        assertTrue(product.getIsActive());
    }

    @Test
    void testPreUpdate() throws InterruptedException {
        Product product = new Product();
        product.prePersist();
        Instant initialUpdate = product.getUpdatedAt();

        Thread.sleep(10);
        product.preUpdate();

        assertTrue(product.getUpdatedAt().isAfter(initialUpdate) || product.getUpdatedAt().equals(initialUpdate));
    }

    @Test
    void testEqualsAndHashCode() {
        Category category = new Category(1L, "Beverages", "Drinks");
        Product p1 = new Product(1L, "SKU-001", "Item A", "Desc", category,
                new BigDecimal("10.00"), 5, 2, true);
        Product p2 = new Product(1L, "SKU-001", "Item A Updated", "New Desc", category,
                new BigDecimal("15.00"), 10, 4, true);
        Product p3 = new Product(2L, "SKU-002", "Item B", "Desc", category,
                new BigDecimal("20.00"), 8, 3, true);

        assertEquals(p1, p2);
        assertEquals(p1.hashCode(), p2.hashCode());
        assertNotEquals(p1, p3);
    }
}
