package com.retail.inventory.dto;

import com.retail.inventory.entity.Sale;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

public class SaleResponse {

    private Long id;
    private String receiptNumber;
    private Long cashierId;
    private String cashierUsername;
    private String cashierFullName;
    private Instant saleDate;
    private BigDecimal totalAmount;
    private List<SaleItemResponse> items;
    private Instant createdAt;

    public SaleResponse() {
    }

    public SaleResponse(Long id, String receiptNumber, Long cashierId, String cashierUsername,
                        String cashierFullName, Instant saleDate, BigDecimal totalAmount,
                        List<SaleItemResponse> items, Instant createdAt) {
        this.id = id;
        this.receiptNumber = receiptNumber;
        this.cashierId = cashierId;
        this.cashierUsername = cashierUsername;
        this.cashierFullName = cashierFullName;
        this.saleDate = saleDate;
        this.totalAmount = totalAmount;
        this.items = items;
        this.createdAt = createdAt;
    }

    public static SaleResponse fromEntity(Sale sale) {
        if (sale == null) {
            return null;
        }
        List<SaleItemResponse> itemResponses = sale.getItems() != null
                ? sale.getItems().stream().map(SaleItemResponse::fromEntity).toList()
                : Collections.emptyList();

        return new SaleResponse(
                sale.getId(),
                sale.getReceiptNumber(),
                sale.getCashier().getId(),
                sale.getCashier().getUsername(),
                sale.getCashier().getFullName(),
                sale.getSaleDate(),
                sale.getTotalAmount(),
                itemResponses,
                sale.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public Long getCashierId() {
        return cashierId;
    }

    public void setCashierId(Long cashierId) {
        this.cashierId = cashierId;
    }

    public String getCashierUsername() {
        return cashierUsername;
    }

    public void setCashierUsername(String cashierUsername) {
        this.cashierUsername = cashierUsername;
    }

    public String getCashierFullName() {
        return cashierFullName;
    }

    public void setCashierFullName(String cashierFullName) {
        this.cashierFullName = cashierFullName;
    }

    public Instant getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(Instant saleDate) {
        this.saleDate = saleDate;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public List<SaleItemResponse> getItems() {
        return items;
    }

    public void setItems(List<SaleItemResponse> items) {
        this.items = items;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
