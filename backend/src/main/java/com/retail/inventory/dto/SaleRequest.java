package com.retail.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class SaleRequest {

    @NotEmpty(message = "Sale items must not be empty")
    @Valid
    private List<SaleItemRequest> items;

    public SaleRequest() {
    }

    public SaleRequest(List<SaleItemRequest> items) {
        this.items = items;
    }

    public List<SaleItemRequest> getItems() {
        return items;
    }

    public void setItems(List<SaleItemRequest> items) {
        this.items = items;
    }
}
