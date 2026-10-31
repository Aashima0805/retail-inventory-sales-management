package com.retail.inventory.service;

import com.retail.inventory.dto.*;
import com.retail.inventory.entity.*;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.ProductRepository;
import com.retail.inventory.repository.StockAdjustmentRepository;
import com.retail.inventory.repository.StockReceiptRepository;
import com.retail.inventory.repository.SupplierRepository;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private StockReceiptRepository stockReceiptRepository;

    @Mock
    private StockAdjustmentRepository stockAdjustmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private InventoryService inventoryService;

    private User adminUser;
    private CustomUserDetails userDetails;
    private Supplier supplier;
    private Product product;

    @BeforeEach
    void setUp() {
        Role role = new Role(1L, "ROLE_ADMIN");
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setUsername("admin");
        adminUser.setRole(role);
        adminUser.setIsActive(true);

        userDetails = new CustomUserDetails(adminUser);

        supplier = new Supplier(1L, "Apex Food", "Rajesh", "12345", "a@a.com", "Addr", true);

        Category category = new Category(1L, "Beverages", "Drinks");
        product = new Product(10L, "BEV-001", "Mineral Water", "Desc", category,
                new BigDecimal("20.00"), 50, 10, true);
    }

    @Test
    void recordIncomingStock_WhenValid_ShouldIncreaseStockAndLogAudit() {
        StockReceiptItemRequest itemRequest = new StockReceiptItemRequest(10L, 25, new BigDecimal("15.00"));
        StockReceiptRequest request = new StockReceiptRequest(1L, "Initial shipment", List.of(itemRequest));

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(stockReceiptRepository.save(any(StockReceipt.class))).thenAnswer(invocation -> {
            StockReceipt r = invocation.getArgument(0);
            r.setId(100L);
            return r;
        });

        StockReceiptResponse response = inventoryService.recordIncomingStock(request, userDetails);

        assertNotNull(response);
        assertEquals(75, product.getCurrentStock(), "Product stock must increase from 50 to 75");
        assertEquals(25, response.getTotalQuantityReceived());
        verify(productRepository).save(product);
        verify(stockReceiptRepository).save(any(StockReceipt.class));
        verify(auditService).logEvent(eq("STOCK_INCOMING"), eq("STOCK_RECEIPT"), eq(100L), eq(adminUser), any());
    }

    @Test
    void recordIncomingStock_WhenSupplierInactive_ShouldThrowBadRequest() {
        supplier.setIsActive(false);
        StockReceiptItemRequest itemRequest = new StockReceiptItemRequest(10L, 10, new BigDecimal("15.00"));
        StockReceiptRequest request = new StockReceiptRequest(1L, "Notes", List.of(itemRequest));

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> inventoryService.recordIncomingStock(request, userDetails));
        assertEquals(400, ex.getStatusCode().value());
        verify(stockReceiptRepository, never()).save(any());
    }

    @Test
    void recordIncomingStock_WhenProductInactive_ShouldThrowBadRequest() {
        product.setIsActive(false);
        StockReceiptItemRequest itemRequest = new StockReceiptItemRequest(10L, 10, new BigDecimal("15.00"));
        StockReceiptRequest request = new StockReceiptRequest(1L, "Notes", List.of(itemRequest));

        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> inventoryService.recordIncomingStock(request, userDetails));
        assertEquals(400, ex.getStatusCode().value());
        verify(stockReceiptRepository, never()).save(any());
    }

    @Test
    void adjustStock_WhenValid_ShouldUpdateStockAndLogAudit() {
        StockAdjustmentRequest request = new StockAdjustmentRequest(10L, -10, "Damaged in transit");

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(stockAdjustmentRepository.save(any(StockAdjustment.class))).thenAnswer(invocation -> {
            StockAdjustment sa = invocation.getArgument(0);
            sa.setId(200L);
            return sa;
        });

        StockAdjustmentResponse response = inventoryService.adjustStock(request, userDetails);

        assertNotNull(response);
        assertEquals(40, product.getCurrentStock(), "Stock should decrease from 50 to 40");
        assertEquals(50, response.getPreviousStock());
        assertEquals(40, response.getNewStock());
        verify(productRepository).save(product);
        verify(stockAdjustmentRepository).save(any(StockAdjustment.class));
        verify(auditService).logEvent(eq("STOCK_ADJUSTMENT"), eq("STOCK_ADJUSTMENT"), eq(200L), eq(adminUser), any());
    }

    @Test
    void adjustStock_WhenResultingStockNegative_ShouldThrowBadRequest() {
        // Current stock is 50, trying to reduce by 60
        StockAdjustmentRequest request = new StockAdjustmentRequest(10L, -60, "Excess shrinkage");

        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> inventoryService.adjustStock(request, userDetails));

        assertEquals(400, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Insufficient stock"));
        assertEquals(50, product.getCurrentStock(), "Product stock must remain untouched");
        verify(stockAdjustmentRepository, never()).save(any());
    }

    @Test
    void adjustStock_WhenZeroChange_ShouldThrowBadRequest() {
        StockAdjustmentRequest request = new StockAdjustmentRequest(10L, 0, "No change");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> inventoryService.adjustStock(request, userDetails));
        assertEquals(400, ex.getStatusCode().value());
    }
}
