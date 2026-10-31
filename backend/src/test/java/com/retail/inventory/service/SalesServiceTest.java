package com.retail.inventory.service;

import com.retail.inventory.dto.*;
import com.retail.inventory.entity.*;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.ProductRepository;
import com.retail.inventory.repository.SaleRepository;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SalesServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private SalesService salesService;

    private User cashier1;
    private User cashier2;
    private User adminUser;
    private CustomUserDetails cashier1Details;
    private CustomUserDetails adminDetails;

    private Product product1;
    private Product product2;

    @BeforeEach
    void setUp() {
        Role cashierRole = new Role(2L, "ROLE_CASHIER");
        Role adminRole = new Role(1L, "ROLE_ADMIN");

        cashier1 = new User();
        cashier1.setId(2L);
        cashier1.setUsername("cashier1");
        cashier1.setFullName("Alice");
        cashier1.setRole(cashierRole);
        cashier1.setIsActive(true);

        cashier2 = new User();
        cashier2.setId(3L);
        cashier2.setUsername("cashier2");
        cashier2.setFullName("Bob");
        cashier2.setRole(cashierRole);
        cashier2.setIsActive(true);

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setFullName("Manager");
        adminUser.setRole(adminRole);
        adminUser.setIsActive(true);

        cashier1Details = new CustomUserDetails(cashier1);
        adminDetails = new CustomUserDetails(adminUser);

        Category category = new Category(1L, "Beverages", "Drinks");

        product1 = new Product(10L, "BEV-001", "Mineral Water 1L", "Water", category,
                new BigDecimal("20.00"), 50, 10, true);

        product2 = new Product(20L, "BEV-002", "Orange Juice 1L", "Juice", category,
                new BigDecimal("80.00"), 10, 5, true);
    }

    @Test
    void checkout_WhenValid_ShouldDecreaseStockCalculateTotalsAndLogAudit() {
        SaleRequest request = new SaleRequest(List.of(
                new SaleItemRequest(10L, 2), // 2 * 20.00 = 40.00
                new SaleItemRequest(20L, 1)  // 1 * 80.00 = 80.00 => Total = 120.00
        ));

        when(userRepository.findById(2L)).thenReturn(Optional.of(cashier1));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product1));
        when(productRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(product2));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> {
            Sale s = invocation.getArgument(0);
            s.setId(100L);
            return s;
        });

        SaleResponse response = salesService.checkout(request, cashier1Details);

        assertNotNull(response);
        assertEquals(new BigDecimal("120.00"), response.getTotalAmount());
        assertEquals(48, product1.getCurrentStock(), "Product1 stock should decrease by 2");
        assertEquals(9, product2.getCurrentStock(), "Product2 stock should decrease by 1");
        verify(productRepository).save(product1);
        verify(productRepository).save(product2);
        verify(saleRepository).save(any(Sale.class));
        verify(auditService).logEvent(eq("SALE_COMPLETED"), eq("SALE"), eq(100L), eq(cashier1), any());
    }

    @Test
    void checkout_WhenDuplicateProductIdsInRequest_ShouldSafelyAggregateQuantities() {
        // Two lines with product1: quantity 3 and quantity 2 => aggregate = 5
        SaleRequest request = new SaleRequest(List.of(
                new SaleItemRequest(10L, 3),
                new SaleItemRequest(10L, 2)
        ));

        when(userRepository.findById(2L)).thenReturn(Optional.of(cashier1));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product1));
        when(saleRepository.save(any(Sale.class))).thenAnswer(invocation -> {
            Sale s = invocation.getArgument(0);
            s.setId(101L);
            return s;
        });

        SaleResponse response = salesService.checkout(request, cashier1Details);

        assertNotNull(response);
        assertEquals(new BigDecimal("100.00"), response.getTotalAmount()); // 5 * 20.00
        assertEquals(45, product1.getCurrentStock(), "Stock should decrease by 5");
        assertEquals(1, response.getItems().size(), "Items should be aggregated to 1 item");
        assertEquals(5, response.getItems().get(0).getQuantity());
    }

    @Test
    void checkout_WhenInsufficientStock_ShouldRejectAndNotModifyStock() {
        // Request 60 units when only 50 available
        SaleRequest request = new SaleRequest(List.of(new SaleItemRequest(10L, 60)));

        when(userRepository.findById(2L)).thenReturn(Optional.of(cashier1));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product1));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> salesService.checkout(request, cashier1Details));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Insufficient stock"));
        assertEquals(50, product1.getCurrentStock(), "Product stock must remain untouched");
        verify(saleRepository, never()).save(any());
        verify(auditService, never()).logEvent(any(), any(), any(), any(), any());
    }

    @Test
    void checkout_WhenProductInactive_ShouldReject() {
        product1.setIsActive(false);
        SaleRequest request = new SaleRequest(List.of(new SaleItemRequest(10L, 1)));

        when(userRepository.findById(2L)).thenReturn(Optional.of(cashier1));
        when(productRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(product1));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> salesService.checkout(request, cashier1Details));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("inactive"));
        verify(saleRepository, never()).save(any());
    }

    @Test
    void checkout_WhenProductNotFound_ShouldThrowNotFound() {
        SaleRequest request = new SaleRequest(List.of(new SaleItemRequest(999L, 1)));

        when(userRepository.findById(2L)).thenReturn(Optional.of(cashier1));
        when(productRepository.findByIdForUpdate(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> salesService.checkout(request, cashier1Details));
    }

    @Test
    void getSales_WhenAdmin_ShouldQueryAllSales() {
        when(saleRepository.findAll(any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(new Sale(1L, "SALE-1", cashier1, Instant.now(), new BigDecimal("50.00"), Instant.now()))));

        Page<SaleResponse> result = salesService.getSales(adminDetails, null, null, PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        verify(saleRepository).findAll(any(PageRequest.class));
    }

    @Test
    void getSales_WhenCashier_ShouldQueryOnlyCashierSales() {
        when(saleRepository.findByCashierId(eq(2L), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(new Sale(1L, "SALE-1", cashier1, Instant.now(), new BigDecimal("50.00"), Instant.now()))));

        Page<SaleResponse> result = salesService.getSales(cashier1Details, null, null, PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        verify(saleRepository).findByCashierId(eq(2L), any(PageRequest.class));
    }

    @Test
    void getSaleById_WhenCashierAccessingOtherCashierSale_ShouldThrowAccessDenied() {
        Sale otherSale = new Sale(50L, "SALE-50", cashier2, Instant.now(), new BigDecimal("30.00"), Instant.now());
        when(saleRepository.findById(50L)).thenReturn(Optional.of(otherSale));

        assertThrows(AccessDeniedException.class,
                () -> salesService.getSaleById(50L, cashier1Details));
    }

    @Test
    void getSaleById_WhenAdminAccessingAnySale_ShouldSucceed() {
        Sale otherSale = new Sale(50L, "SALE-50", cashier2, Instant.now(), new BigDecimal("30.00"), Instant.now());
        when(saleRepository.findById(50L)).thenReturn(Optional.of(otherSale));

        SaleResponse response = salesService.getSaleById(50L, adminDetails);

        assertNotNull(response);
        assertEquals(50L, response.getId());
    }
}
