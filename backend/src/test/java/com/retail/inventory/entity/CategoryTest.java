package com.retail.inventory.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CategoryTest {

    @Test
    void testCategoryPropertiesAndConstructors() {
        Category category = new Category();
        category.setId(10L);
        category.setName("Beverages");
        category.setDescription("Cold and hot drinks");

        assertEquals(10L, category.getId());
        assertEquals("Beverages", category.getName());
        assertEquals("Cold and hot drinks", category.getDescription());

        Category paramCategory = new Category(20L, "Dairy", "Milk and cheese");
        assertEquals(20L, paramCategory.getId());
        assertEquals("Dairy", paramCategory.getName());
        assertEquals("Milk and cheese", paramCategory.getDescription());
    }

    @Test
    void testEqualsAndHashCode() {
        Category cat1 = new Category(1L, "Snacks", "Crisps");
        Category cat2 = new Category(1L, "Snacks", "Different description");
        Category cat3 = new Category(2L, "Bakery", "Breads");

        assertEquals(cat1, cat2);
        assertEquals(cat1.hashCode(), cat2.hashCode());
        assertNotEquals(cat1, cat3);
    }
}
