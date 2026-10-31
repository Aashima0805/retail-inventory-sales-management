package com.retail.inventory.service;

import com.retail.inventory.dto.SaleItemRequest;
import com.retail.inventory.dto.SaleRequest;
import com.retail.inventory.entity.*;
import com.retail.inventory.repository.CategoryRepository;
import com.retail.inventory.repository.ProductRepository;
import com.retail.inventory.repository.RoleRepository;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class SalesConcurrencyIntegrationTest {

    @Autowired
    private SalesService salesService;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private Long productId;
    private CustomUserDetails cashierUserDetails;

    @BeforeEach
    void setUp() {
        Role cashierRole = roleRepository.findByName("ROLE_CASHIER")
                .orElseGet(() -> roleRepository.save(new Role(null, "ROLE_CASHIER")));

        User cashier = userRepository.findByUsername("test_cashier")
                .orElseGet(() -> {
                    User u = new User();
                    u.setUsername("test_cashier");
                    u.setPasswordHash("$2a$10$abcdefghijklmnopqrstuvwxyz123456");
                    u.setFullName("Test Cashier");
                    u.setRole(cashierRole);
                    u.setIsActive(true);
                    return userRepository.save(u);
                });

        cashierUserDetails = new CustomUserDetails(cashier);

        Category category = categoryRepository.findByNameIgnoreCase("Drinks")
                .orElseGet(() -> categoryRepository.save(new Category(null, "Drinks", "Beverages")));

        Product product = new Product(null, "CONCUR-SKU-1", "Soda Can", "Can", category,
                new BigDecimal("15.00"), 10, 2, true);
        product = productRepository.save(product);
        productId = product.getId();
    }

    @Test
    void concurrentCheckout_CannotOversell() throws InterruptedException {
        int threadCount = 20;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    SaleRequest request = new SaleRequest(List.of(new SaleItemRequest(productId, 1)));
                    salesService.checkout(request, cashierUserDetails);
                    successCount.incrementAndGet();
                } catch (ResponseStatusException ex) {
                    if (ex.getStatusCode().value() == 400) {
                        failCount.incrementAndGet();
                    }
                } catch (Exception ex) {
                    // unexpected error
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(doneLatch.await(15, TimeUnit.SECONDS));
        executor.shutdown();

        Product finalProduct = productRepository.findById(productId).orElseThrow();

        // Initial stock was 10. Exactly 10 checkouts of 1 unit must succeed, 10 must fail
        assertEquals(10, successCount.get(), "Exactly 10 checkouts should succeed");
        assertEquals(10, failCount.get(), "Exactly 10 checkouts should fail due to insufficient stock");
        assertEquals(0, finalProduct.getCurrentStock(), "Final stock must be exactly 0 (never negative)");
    }
}
