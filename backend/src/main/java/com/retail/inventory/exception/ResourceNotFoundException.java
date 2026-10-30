package com.retail.inventory.exception;

/**
 * Thrown when the requested resource cannot be found.
 * Results in HTTP 404 via GlobalExceptionHandler.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
