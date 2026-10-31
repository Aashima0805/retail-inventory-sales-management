package com.retail.inventory.service;

import com.retail.inventory.dto.*;
import com.retail.inventory.entity.*;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.ProductRepository;
import com.retail.inventory.repository.SaleRepository;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.CustomUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class SalesService {

    private static final Logger logger = LoggerFactory.getLogger(SalesService.class);
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC);
    private final Random random = new SecureRandom();

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public SalesService(SaleRepository saleRepository,
                        ProductRepository productRepository,
                        UserRepository userRepository,
                        AuditService auditService) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public SaleResponse checkout(SaleRequest request, CustomUserDetails currentUser) {
        User cashier = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUser.getUsername()));

        // Safely aggregate quantities by product ID
        Map<Long, Integer> aggregatedItems = new LinkedHashMap<>();
        for (SaleItemRequest itemReq : request.getItems()) {
            aggregatedItems.merge(itemReq.getProductId(), itemReq.getQuantity(), Integer::sum);
        }

        // Lock products in strictly ascending product-ID order to prevent deadlocks
        List<Long> sortedProductIds = new ArrayList<>(aggregatedItems.keySet());
        Collections.sort(sortedProductIds);

        String receiptNumber = generateReceiptNumber();

        Sale sale = new Sale();
        sale.setReceiptNumber(receiptNumber);
        sale.setCashier(cashier);
        sale.setSaleDate(Instant.now());

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (Long productId : sortedProductIds) {
            Product product = productRepository.findByIdForUpdate(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

            if (!Boolean.TRUE.equals(product.getIsActive())) {
                logger.warn("Checkout rejected: product '{}' is inactive", product.getSku());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Product '" + product.getSku() + "' is inactive and cannot be sold");
            }

            int requestedQty = aggregatedItems.get(productId);
            if (product.getCurrentStock() < requestedQty) {
                logger.warn("Checkout rejected: insufficient stock for product '{}'. Available={}, Requested={}",
                        product.getSku(), product.getCurrentStock(), requestedQty);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Insufficient stock for product '" + product.getName() + "' (" + product.getSku() +
                                "). Available: " + product.getCurrentStock() + ", requested: " + requestedQty);
            }

            // Deduct inventory
            product.setCurrentStock(product.getCurrentStock() - requestedQty);
            productRepository.save(product);

            // Compute line total
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(requestedQty));
            totalAmount = totalAmount.add(lineTotal);

            // Immutable snapshot of product name and unit price
            SaleItem saleItem = new SaleItem();
            saleItem.setProduct(product);
            saleItem.setProductNameSnapshot(product.getName());
            saleItem.setQuantity(requestedQty);
            saleItem.setUnitPrice(product.getPrice());
            saleItem.setLineTotal(lineTotal);

            sale.addItem(saleItem);
        }

        sale.setTotalAmount(totalAmount);
        Sale savedSale = saleRepository.save(sale);

        // Audit log
        auditService.logEvent(
                "SALE_COMPLETED",
                "SALE",
                savedSale.getId(),
                cashier,
                "Sale completed: receipt=" + receiptNumber + ", items=" + sale.getItems().size() +
                        ", totalAmount=" + totalAmount
        );

        logger.info("Sale completed successfully: receipt='{}', totalAmount={}, cashier='{}'",
                receiptNumber, totalAmount, cashier.getUsername());

        return SaleResponse.fromEntity(savedSale);
    }

    @Transactional(readOnly = true)
    public Page<SaleResponse> getSales(CustomUserDetails currentUser, Instant startDate, Instant endDate, Pageable pageable) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleName.ADMIN));

        Page<Sale> salesPage;
        if (isAdmin) {
            if (startDate != null && endDate != null) {
                salesPage = saleRepository.findBySaleDateBetween(startDate, endDate, pageable);
            } else {
                salesPage = saleRepository.findAll(pageable);
            }
        } else {
            // Cashier sees only their own sales
            if (startDate != null && endDate != null) {
                salesPage = saleRepository.findByCashierIdAndSaleDateBetween(currentUser.getId(), startDate, endDate, pageable);
            } else {
                salesPage = saleRepository.findByCashierId(currentUser.getId(), pageable);
            }
        }

        return salesPage.map(SaleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SaleResponse getSaleById(Long id, CustomUserDetails currentUser) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id: " + id));

        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleName.ADMIN));

        if (!isAdmin && !sale.getCashier().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You do not have permission to view this sale");
        }

        return SaleResponse.fromEntity(sale);
    }

    private String generateReceiptNumber() {
        String datePart = DATE_FORMATTER.format(Instant.now());
        for (int i = 0; i < 10; i++) {
            int randomNum = random.nextInt(10000);
            String candidate = String.format("SALE-%s-%04d", datePart, randomNum);
            if (!saleRepository.existsByReceiptNumber(candidate)) {
                return candidate;
            }
        }
        return String.format("SALE-%s-%04d", datePart, System.currentTimeMillis() % 10000);
    }
}
