package com.retail.inventory.dto;

import com.retail.inventory.entity.StockReceipt;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

public class StockReceiptResponse {

    private Long id;
    private String receiptReference;
    private Long supplierId;
    private String supplierName;
    private String receivedByUsername;
    private Instant receivedDate;
    private String notes;
    private Integer totalQuantityReceived;
    private List<StockReceiptItemResponse> items;
    private Instant createdAt;

    public StockReceiptResponse() {
    }

    public StockReceiptResponse(Long id, String receiptReference, Long supplierId,
                                String supplierName, String receivedByUsername, Instant receivedDate,
                                String notes, Integer totalQuantityReceived,
                                List<StockReceiptItemResponse> items, Instant createdAt) {
        this.id = id;
        this.receiptReference = receiptReference;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
        this.receivedByUsername = receivedByUsername;
        this.receivedDate = receivedDate;
        this.notes = notes;
        this.totalQuantityReceived = totalQuantityReceived;
        this.items = items;
        this.createdAt = createdAt;
    }

    public static StockReceiptResponse fromEntity(StockReceipt receipt) {
        if (receipt == null) {
            return null;
        }
        List<StockReceiptItemResponse> itemResponses = receipt.getItems() != null
                ? receipt.getItems().stream().map(StockReceiptItemResponse::fromEntity).toList()
                : Collections.emptyList();

        return new StockReceiptResponse(
                receipt.getId(),
                receipt.getReceiptReference(),
                receipt.getSupplier().getId(),
                receipt.getSupplier().getName(),
                receipt.getReceivedBy().getUsername(),
                receipt.getReceivedDate(),
                receipt.getNotes(),
                receipt.getTotalQuantityReceived(),
                itemResponses,
                receipt.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReceiptReference() {
        return receiptReference;
    }

    public void setReceiptReference(String receiptReference) {
        this.receiptReference = receiptReference;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getReceivedByUsername() {
        return receivedByUsername;
    }

    public void setReceivedByUsername(String receivedByUsername) {
        this.receivedByUsername = receivedByUsername;
    }

    public Instant getReceivedDate() {
        return receivedDate;
    }

    public void setReceivedDate(Instant receivedDate) {
        this.receivedDate = receivedDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Integer getTotalQuantityReceived() {
        return totalQuantityReceived;
    }

    public void setTotalQuantityReceived(Integer totalQuantityReceived) {
        this.totalQuantityReceived = totalQuantityReceived;
    }

    public List<StockReceiptItemResponse> getItems() {
        return items;
    }

    public void setItems(List<StockReceiptItemResponse> items) {
        this.items = items;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
