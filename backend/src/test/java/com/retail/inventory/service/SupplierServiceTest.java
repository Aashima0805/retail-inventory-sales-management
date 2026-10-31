package com.retail.inventory.service;

import com.retail.inventory.dto.SupplierRequest;
import com.retail.inventory.dto.SupplierResponse;
import com.retail.inventory.entity.Supplier;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupplierServiceTest {

    @Mock
    private SupplierRepository supplierRepository;

    @InjectMocks
    private SupplierService supplierService;

    private Supplier supplier;

    @BeforeEach
    void setUp() {
        supplier = new Supplier(1L, "Apex Food Distributors", "Rajesh", "12345", "orders@apex.com", "Address 1", true);
    }

    @Test
    void searchSuppliers_ShouldReturnPagedResponses() {
        Page<Supplier> page = new PageImpl<>(List.of(supplier));
        when(supplierRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        Page<SupplierResponse> result = supplierService.searchSuppliers("Apex", true, PageRequest.of(0, 10));

        assertEquals(1, result.getTotalElements());
        assertEquals("Apex Food Distributors", result.getContent().get(0).getName());
    }

    @Test
    void getSupplierById_WhenFound_ShouldReturnResponse() {
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));

        SupplierResponse response = supplierService.getSupplierById(1L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Apex Food Distributors", response.getName());
    }

    @Test
    void getSupplierById_WhenNotFound_ShouldThrowException() {
        when(supplierRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> supplierService.getSupplierById(99L));
    }

    @Test
    void createSupplier_WhenValid_ShouldSaveAndReturnResponse() {
        SupplierRequest request = new SupplierRequest("Daily Fresh Dairy", "Sunita", "67890", "info@daily.in", "Address 2");
        when(supplierRepository.existsByNameIgnoreCase("Daily Fresh Dairy")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(invocation -> {
            Supplier s = invocation.getArgument(0);
            s.setId(2L);
            return s;
        });

        SupplierResponse response = supplierService.createSupplier(request);

        assertNotNull(response);
        assertEquals(2L, response.getId());
        assertEquals("Daily Fresh Dairy", response.getName());
        assertTrue(response.getIsActive());
        verify(supplierRepository).save(any(Supplier.class));
    }

    @Test
    void createSupplier_WhenDuplicateName_ShouldThrowException() {
        SupplierRequest request = new SupplierRequest("Apex Food Distributors", "Rajesh", "12345", "orders@apex.com", "Address 1");
        when(supplierRepository.existsByNameIgnoreCase("Apex Food Distributors")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> supplierService.createSupplier(request));
        verify(supplierRepository, never()).save(any(Supplier.class));
    }

    @Test
    void updateSupplier_WhenValid_ShouldPreserveActiveStatus() {
        SupplierRequest request = new SupplierRequest("Apex Foods Ltd", "Rajesh S", "12345", "orders@apexfoods.com", "New Address");
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));
        when(supplierRepository.existsByNameIgnoreCaseAndIdNot("Apex Foods Ltd", 1L)).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenReturn(supplier);

        SupplierResponse response = supplierService.updateSupplier(1L, request);

        assertNotNull(response);
        assertEquals("Apex Foods Ltd", response.getName());
        assertTrue(response.getIsActive());
        verify(supplierRepository).save(supplier);
    }

    @Test
    void updateSupplier_WhenDuplicateNameOnOtherId_ShouldThrowException() {
        SupplierRequest request = new SupplierRequest("Daily Fresh Dairy", "Sunita", "67890", "info@daily.in", "Address 2");
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));
        when(supplierRepository.existsByNameIgnoreCaseAndIdNot("Daily Fresh Dairy", 1L)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> supplierService.updateSupplier(1L, request));
        verify(supplierRepository, never()).save(any(Supplier.class));
    }

    @Test
    void deactivateSupplier_ShouldSetIsActiveToFalse() {
        when(supplierRepository.findById(1L)).thenReturn(Optional.of(supplier));
        when(supplierRepository.save(any(Supplier.class))).thenReturn(supplier);

        supplierService.deactivateSupplier(1L);

        assertFalse(supplier.getIsActive());
        verify(supplierRepository).save(supplier);
        verify(supplierRepository, never()).delete(any(Supplier.class));
    }

    @Test
    void deactivateSupplier_WhenNotFound_ShouldThrowException() {
        when(supplierRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> supplierService.deactivateSupplier(99L));
    }
}
