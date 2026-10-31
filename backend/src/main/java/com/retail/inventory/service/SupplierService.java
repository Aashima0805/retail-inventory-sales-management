package com.retail.inventory.service;

import com.retail.inventory.dto.SupplierRequest;
import com.retail.inventory.dto.SupplierResponse;
import com.retail.inventory.entity.Supplier;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.SupplierRepository;
import com.retail.inventory.repository.SupplierSpecification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupplierService {

    private static final Logger logger = LoggerFactory.getLogger(SupplierService.class);

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Transactional(readOnly = true)
    public Page<SupplierResponse> searchSuppliers(String keyword, Boolean isActive, Pageable pageable) {
        Specification<Supplier> spec = SupplierSpecification.filter(keyword, isActive);
        return supplierRepository.findAll(spec, pageable)
                .map(SupplierResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .map(SupplierResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        String trimmedName = request.getName().trim();
        if (supplierRepository.existsByNameIgnoreCase(trimmedName)) {
            logger.warn("Supplier creation rejected: duplicate name '{}'", trimmedName);
            throw new DuplicateResourceException("Supplier with name '" + trimmedName + "' already exists");
        }

        Supplier supplier = new Supplier();
        supplier.setName(trimmedName);
        supplier.setContactPerson(request.getContactPerson());
        supplier.setPhone(request.getPhone());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());
        supplier.setIsActive(true);

        Supplier saved = supplierRepository.save(supplier);
        logger.info("Supplier created successfully: id={}, name='{}'", saved.getId(), saved.getName());
        return SupplierResponse.fromEntity(saved);
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));

        String trimmedName = request.getName().trim();
        if (supplierRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            logger.warn("Supplier update rejected: duplicate name '{}' on id={}", trimmedName, id);
            throw new DuplicateResourceException("Supplier with name '" + trimmedName + "' already exists");
        }

        supplier.setName(trimmedName);
        supplier.setContactPerson(request.getContactPerson());
        supplier.setPhone(request.getPhone());
        supplier.setEmail(request.getEmail());
        supplier.setAddress(request.getAddress());
        // Preserves isActive

        Supplier updated = supplierRepository.save(supplier);
        logger.info("Supplier updated successfully: id={}, name='{}'", updated.getId(), updated.getName());
        return SupplierResponse.fromEntity(updated);
    }

    @Transactional
    public void deactivateSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));

        supplier.setIsActive(false);
        supplierRepository.save(supplier);
        logger.info("Supplier deactivated successfully: id={}, name='{}'", supplier.getId(), supplier.getName());
    }
}
