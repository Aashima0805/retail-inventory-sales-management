package com.retail.inventory.controller;

import com.retail.inventory.dto.SaleRequest;
import com.retail.inventory.dto.SaleResponse;
import com.retail.inventory.security.CustomUserDetails;
import com.retail.inventory.service.SalesService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/sales")
public class SalesController {

    private final SalesService salesService;

    public SalesController(SalesService salesService) {
        this.salesService = salesService;
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<SaleResponse> checkout(
            @Valid @RequestBody SaleRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        SaleResponse response = salesService.checkout(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<Page<SaleResponse>> getSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            Pageable pageable,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        Page<SaleResponse> sales = salesService.getSales(currentUser, startDate, endDate, pageable);
        return ResponseEntity.ok(sales);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<SaleResponse> getSaleById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        SaleResponse sale = salesService.getSaleById(id, currentUser);
        return ResponseEntity.ok(sale);
    }
}
