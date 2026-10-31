package com.retail.inventory.repository;

import com.retail.inventory.entity.Category;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class CategoryRepositoryTest {

    @Autowired
    private CategoryRepository categoryRepository;

    private Category beverages;
    private Category dairy;

    @BeforeEach
    void setUp() {
        categoryRepository.deleteAll();
        beverages = categoryRepository.save(new Category(null, "Beverages", "Drinks"));
        dairy = categoryRepository.save(new Category(null, "Dairy & Eggs", "Dairy items"));
    }

    @Test
    void testExistsByNameIgnoreCase() {
        assertTrue(categoryRepository.existsByNameIgnoreCase("beverages"));
        assertTrue(categoryRepository.existsByNameIgnoreCase("BEVERAGES"));
        assertTrue(categoryRepository.existsByNameIgnoreCase("Beverages"));
        assertFalse(categoryRepository.existsByNameIgnoreCase("Bakery"));
    }

    @Test
    void testExistsByNameIgnoreCaseAndIdNot() {
        // Checking against own ID should return false
        assertFalse(categoryRepository.existsByNameIgnoreCaseAndIdNot("beverages", beverages.getId()));

        // Checking against another ID when name matches should return true
        assertTrue(categoryRepository.existsByNameIgnoreCaseAndIdNot("beverages", dairy.getId()));

        // Checking with an unrelated name should return false
        assertFalse(categoryRepository.existsByNameIgnoreCaseAndIdNot("Produce", dairy.getId()));
    }

    @Test
    void testPaginatedCategoryListing() {
        Page<Category> page = categoryRepository.findAll(PageRequest.of(0, 1));
        assertEquals(1, page.getContent().size());
        assertEquals(2, page.getTotalElements());
        assertEquals(2, page.getTotalPages());
    }
}
