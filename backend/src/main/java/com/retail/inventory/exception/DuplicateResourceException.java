package com.retail.inventory.exception;

/**
 * Thrown when an operation attempts to create or update a resource with a duplicate
 * unique attribute (e.g., category name or product SKU).
 * Results in HTTP 409 Conflict via GlobalExceptionHandler.
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}
