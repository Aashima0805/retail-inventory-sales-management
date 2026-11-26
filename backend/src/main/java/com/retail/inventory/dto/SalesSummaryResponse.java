package com.retail.inventory.dto;

import java.math.BigDecimal;

public class SalesSummaryResponse {

    private BigDecimal totalSalesAmount;
    private Long numberOfSales;
    private Long totalItemsSold;
    private Long lowStockProductsCount;

    public SalesSummaryResponse() {
    }

    public SalesSummaryResponse(BigDecimal totalSalesAmount, Long numberOfSales, Long totalItemsSold) {
        this(totalSalesAmount, numberOfSales, totalItemsSold, 0L);
    }

    public SalesSummaryResponse(BigDecimal totalSalesAmount, Long numberOfSales, Long totalItemsSold, Long lowStockProductsCount) {
        this.totalSalesAmount = totalSalesAmount;
        this.numberOfSales = numberOfSales;
        this.totalItemsSold = totalItemsSold;
        this.lowStockProductsCount = lowStockProductsCount;
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

    public Long getLowStockProductsCount() {
        return lowStockProductsCount;
    }

    public void setLowStockProductsCount(Long lowStockProductsCount) {
        this.lowStockProductsCount = lowStockProductsCount;
    }
}
