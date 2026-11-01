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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Random;

@Service
public class InventoryService {

    private static final Logger logger = LoggerFactory.getLogger(InventoryService.class);
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC);
    private final Random random = new SecureRandom();

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public InventoryService(ProductRepository productRepository,
                            SupplierRepository supplierRepository,
                            StockReceiptRepository stockReceiptRepository,
                            StockAdjustmentRepository stockAdjustmentRepository,
                            UserRepository userRepository,
                            AuditService auditService) {
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
        this.stockReceiptRepository = stockReceiptRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public StockReceiptResponse recordIncomingStock(StockReceiptRequest request, CustomUserDetails currentUser) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + request.getSupplierId()));

        if (!Boolean.TRUE.equals(supplier.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Supplier is inactive: " + supplier.getName());
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUser.getUsername()));

        String reference = generateReceiptReference();

        StockReceipt receipt = new StockReceipt();
        receipt.setReceiptReference(reference);
        receipt.setSupplier(supplier);
        receipt.setReceivedBy(user);
        receipt.setReceivedDate(Instant.now());
        receipt.setNotes(request.getNotes());

        int totalQuantity = 0;

        for (StockReceiptItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemRequest.getProductId()));

            if (!Boolean.TRUE.equals(product.getIsActive())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot receive stock for inactive product: " + product.getSku());
            }

            // Increase product stock transactionally
            int updatedStock = product.getCurrentStock() + itemRequest.getQuantityReceived();
            product.setCurrentStock(updatedStock);
            productRepository.save(product);

            StockReceiptItem item = new StockReceiptItem();
            item.setProduct(product);
            item.setQuantityReceived(itemRequest.getQuantityReceived());
            item.setUnitCost(itemRequest.getUnitCost());

            receipt.addItem(item);
            totalQuantity += itemRequest.getQuantityReceived();
        }

        receipt.setTotalQuantityReceived(totalQuantity);
        StockReceipt savedReceipt = stockReceiptRepository.save(receipt);

        // Audit log
        auditService.logEvent(
                "STOCK_INCOMING",
                "STOCK_RECEIPT",
                savedReceipt.getId(),
                user,
                "Received " + totalQuantity + " units from supplier '" + supplier.getName() + "' (Ref: " + reference + ")"
        );

        logger.info("Stock receipt recorded successfully: ref='{}', totalUnits={}", reference, totalQuantity);
        return StockReceiptResponse.fromEntity(savedReceipt);
    }

    @Transactional
    public StockAdjustmentResponse adjustStock(StockAdjustmentRequest request, CustomUserDetails currentUser) {
        if (request.getQuantityChange() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity change cannot be zero");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        if (!Boolean.TRUE.equals(product.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot adjust stock for inactive product: " + product.getSku());
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUser.getUsername()));

        int previousStock = product.getCurrentStock();
        int newStock = previousStock + request.getQuantityChange();

        if (newStock < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Insufficient stock. Resulting stock cannot be negative (current: " + previousStock +
                            ", change: " + request.getQuantityChange() + ")"
            );
        }

        product.setCurrentStock(newStock);
        productRepository.save(product);

        StockAdjustment adjustment = new StockAdjustment();
        adjustment.setProduct(product);
        adjustment.setUser(user);
        adjustment.setQuantityChange(request.getQuantityChange());
        adjustment.setPreviousStock(previousStock);
        adjustment.setNewStock(newStock);
        adjustment.setReason(request.getReason().trim());
        adjustment.setAdjustmentDate(Instant.now());

        StockAdjustment savedAdjustment = stockAdjustmentRepository.save(adjustment);

        // Audit log
        auditService.logEvent(
                "STOCK_ADJUSTMENT",
                "STOCK_ADJUSTMENT",
                savedAdjustment.getId(),
                user,
                "Adjusted product '" + product.getSku() + "' by " + request.getQuantityChange() +
                        " (from " + previousStock + " to " + newStock + "). Reason: " + request.getReason().trim()
        );

        logger.info("Stock adjustment recorded: id={}, product='{}', previous={}, new={}",
                savedAdjustment.getId(), product.getSku(), previousStock, newStock);
        return StockAdjustmentResponse.fromEntity(savedAdjustment);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getStockListing(Pageable pageable) {
        return productRepository.findAll(pageable).map(ProductResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductStockDetails(Long productId) {
        return productRepository.findById(productId)
                .map(ProductResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getLowStockProducts(Pageable pageable) {
        return productRepository.findLowStockProducts(pageable).map(ProductResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<StockReceiptResponse> getReceiptHistory(Instant start, Instant end, Pageable pageable) {
        return stockReceiptRepository.findByDateRange(start, end, pageable)
                .map(StockReceiptResponse::fromEntity);
    }

    private String generateReceiptReference() {
        String datePart = DATE_FORMATTER.format(Instant.now());
        for (int i = 0; i < 10; i++) {
            int randomNum = random.nextInt(10000);
            String candidate = String.format("REC-%s-%04d", datePart, randomNum);
            if (!stockReceiptRepository.existsByReceiptReference(candidate)) {
                return candidate;
            }
        }
        // Fallback with millisecond suffix if multiple collisions occur
        return String.format("REC-%s-%04d", datePart, System.currentTimeMillis() % 10000);
    }
}
