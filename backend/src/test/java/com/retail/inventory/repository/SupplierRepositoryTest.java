package com.retail.inventory.repository;

import com.retail.inventory.entity.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class SupplierRepositoryTest {

    @Autowired
    private SupplierRepository supplierRepository;

    private Supplier apex;
    private Supplier dailyFresh;

    @BeforeEach
    void setUp() {
        supplierRepository.deleteAll();
        apex = supplierRepository.save(new Supplier(null, "Apex Food Distributors", "Rajesh", "12345", "orders@apex.com", "Address 1", true));
        dailyFresh = supplierRepository.save(new Supplier(null, "Daily Fresh Dairy", "Sunita", "67890", "info@dailyfresh.in", "Address 2", false));
    }

    @Test
    void testExistsByNameIgnoreCase() {
        assertTrue(supplierRepository.existsByNameIgnoreCase("apex food distributors"));
        assertTrue(supplierRepository.existsByNameIgnoreCase("APEX FOOD DISTRIBUTORS"));
        assertFalse(supplierRepository.existsByNameIgnoreCase("Heritage Bakery"));
    }

    @Test
    void testExistsByNameIgnoreCaseAndIdNot() {
        assertFalse(supplierRepository.existsByNameIgnoreCaseAndIdNot("Apex Food Distributors", apex.getId()));
        assertTrue(supplierRepository.existsByNameIgnoreCaseAndIdNot("Apex Food Distributors", dailyFresh.getId()));
        assertFalse(supplierRepository.existsByNameIgnoreCaseAndIdNot("New Supplier", apex.getId()));
    }

    @Test
    void testSearchByKeyword() {
        Specification<Supplier> spec = SupplierSpecification.filter("daily", null);
        Page<Supplier> result = supplierRepository.findAll(spec, PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("Daily Fresh Dairy", result.getContent().get(0).getName());
    }

    @Test
    void testSearchByActiveStatus() {
        Specification<Supplier> spec = SupplierSpecification.filter(null, true);
        Page<Supplier> result = supplierRepository.findAll(spec, PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("Apex Food Distributors", result.getContent().get(0).getName());
    }
}
