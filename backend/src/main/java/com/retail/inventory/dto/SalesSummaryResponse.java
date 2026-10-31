package com.retail.inventory.dto;

import java.math.BigDecimal;

public class SalesSummaryResponse {

    private BigDecimal totalSalesAmount;
    private Long numberOfSales;
    private Long totalItemsSold;

    public SalesSummaryResponse() {
    }

    public SalesSummaryResponse(BigDecimal totalSalesAmount, Long numberOfSales, Long totalItemsSold) {
        this.totalSalesAmount = totalSalesAmount;
        this.numberOfSales = numberOfSales;
        this.totalItemsSold = totalItemsSold;
    }

    public BigDecimal getTotalSalesAmount() {
        return totalSalesAmount;
    }

    public void setTotalSalesAmount(BigDecimal totalSalesAmount) {
        this.totalSalesAmount = totalSalesAmount;
    }

    public Long getNumberOfSales() {
        return numberOfSales;
    }

    public void setNumberOfSales(Long numberOfSales) {
        this.numberOfSales = numberOfSales;
    }

    public Long getTotalItemsSold() {
        return totalItemsSold;
    }

    public void setTotalItemsSold(Long totalItemsSold) {
        this.totalItemsSold = totalItemsSold;
    }
}
