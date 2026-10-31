package com.retail.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class StockReceiptRequest {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private String notes;

    @NotEmpty(message = "Receipt items must not be empty")
    @Valid
    private List<StockReceiptItemRequest> items;

    public StockReceiptRequest() {
    }

    public StockReceiptRequest(Long supplierId, String notes, List<StockReceiptItemRequest> items) {
        this.supplierId = supplierId;
        this.notes = notes;
        this.items = items;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<StockReceiptItemRequest> getItems() {
        return items;
    }

    public void setItems(List<StockReceiptItemRequest> items) {
        this.items = items;
    }
}
