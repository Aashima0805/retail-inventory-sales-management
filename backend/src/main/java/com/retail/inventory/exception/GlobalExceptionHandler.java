package com.retail.inventory.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Global exception handler that produces RFC 7807 ProblemDetail responses.
 *
 * <ul>
 *   <li>Never exposes stack traces, SQL details, password hashes, or internal secrets.</li>
 *   <li>Validation errors enumerate field-level messages.</li>
 *   <li>Authentication/authorization errors return a generic 401/403.</li>
 *   <li>ResourceNotFoundException maps to 404.</li>
 *   <li>ResponseStatusException is passed through with its own status and reason.</li>
 *   <li>All unexpected exceptions return a generic 500.</li>
 * </ul>
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // -----------------------------------------------------------------------
    // Validation errors (Bean Validation / @Valid)
    // -----------------------------------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle("Validation Failed");
        problem.setType(URI.create("https://api.retail-inventory.com/errors/validation-failed"));
        problem.setDetail("One or more fields failed validation.");
        problem.setProperty("timestamp", Instant.now().toString());

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fe.getField(), fe.getDefaultMessage());
        }
        problem.setProperty("fieldErrors", fieldErrors);
        return problem;
    }

    // -----------------------------------------------------------------------
    // Resource not found
    // -----------------------------------------------------------------------

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFound(ResourceNotFoundException ex) {
        logger.debug("Resource not found: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setTitle("Resource Not Found");
        problem.setType(URI.create("https://api.retail-inventory.com/errors/resource-not-found"));
        problem.setDetail(ex.getMessage());
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    // -----------------------------------------------------------------------
    // Duplicate / Conflict (409)
    // -----------------------------------------------------------------------

    @ExceptionHandler(DuplicateResourceException.class)
    public ProblemDetail handleDuplicateResource(DuplicateResourceException ex) {
        logger.warn("Duplicate resource conflict: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setTitle("Conflict");
        problem.setType(URI.create("https://api.retail-inventory.com/errors/conflict"));
        problem.setDetail(ex.getMessage());
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    // -----------------------------------------------------------------------
    // ResponseStatusException (used by AuthService for 401 on bad credentials)
    // -----------------------------------------------------------------------

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        // Only log 5xx as errors; 4xx as warnings
        if (status.is5xxServerError()) {
            logger.error("ResponseStatusException: {}", ex.getReason());
        } else {
            logger.warn("ResponseStatusException [{}]: {}", status.value(), ex.getReason());
        }

        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setTitle(status.getReasonPhrase());
        problem.setType(URI.create("https://api.retail-inventory.com/errors/" + status.value()));
        problem.setDetail(ex.getReason() != null ? ex.getReason() : status.getReasonPhrase());
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    // -----------------------------------------------------------------------
    // Spring Security: Authentication failures (401)
    // -----------------------------------------------------------------------

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException ex) {
        logger.warn("Authentication failure: {}", ex.getClass().getSimpleName());
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        problem.setTitle("Unauthorized");
        problem.setType(URI.create("https://api.retail-inventory.com/errors/unauthorized"));
        problem.setDetail("Authentication is required to access this resource.");
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    // -----------------------------------------------------------------------
    // Spring Security: Access denied (403)
    // -----------------------------------------------------------------------

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        logger.warn("Access denied: {}", ex.getClass().getSimpleName());
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        problem.setTitle("Forbidden");
        problem.setType(URI.create("https://api.retail-inventory.com/errors/forbidden"));
        problem.setDetail("You do not have permission to access this resource.");
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }

    // -----------------------------------------------------------------------
    // Catch-all: unexpected exceptions (500)
    // -----------------------------------------------------------------------

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        // Log full detail internally but never expose it to the client
        logger.error("Unexpected error: {}", ex.getClass().getName(), ex);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        problem.setTitle("Internal Server Error");
        problem.setType(URI.create("https://api.retail-inventory.com/errors/internal-server-error"));
        problem.setDetail("An unexpected error occurred. Please contact support if the problem persists.");
        problem.setProperty("timestamp", Instant.now().toString());
        return problem;
    }
}
