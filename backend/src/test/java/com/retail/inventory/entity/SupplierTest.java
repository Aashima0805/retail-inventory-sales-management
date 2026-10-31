package com.retail.inventory.entity;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class SupplierTest {

    @Test
    void testPrePersistDefaults() {
        Supplier supplier = new Supplier();
        supplier.setName("Apex Food Distributors");
        supplier.setContactPerson("Rajesh");

        assertNull(supplier.getCreatedAt());
        assertNull(supplier.getUpdatedAt());

        supplier.prePersist();

        assertNotNull(supplier.getCreatedAt());
        assertNotNull(supplier.getUpdatedAt());
        assertTrue(supplier.getIsActive());
    }

    @Test
    void testPreUpdate() throws InterruptedException {
        Supplier supplier = new Supplier();
        supplier.prePersist();
        Instant initialUpdate = supplier.getUpdatedAt();

        Thread.sleep(10);
        supplier.preUpdate();

        assertTrue(supplier.getUpdatedAt().isAfter(initialUpdate) || supplier.getUpdatedAt().equals(initialUpdate));
    }

    @Test
    void testEqualsAndHashCode() {
        Supplier s1 = new Supplier(1L, "Apex", "Rajesh", "1234", "a@a.com", "Addr", true);
        Supplier s2 = new Supplier(1L, "Apex", "Other Contact", "5678", "b@b.com", "Other Addr", true);
        Supplier s3 = new Supplier(2L, "Daily Fresh", "Sunita", "9999", "c@c.com", "Addr", true);

        assertEquals(s1, s2);
        assertEquals(s1.hashCode(), s2.hashCode());
        assertNotEquals(s1, s3);
    }
}
