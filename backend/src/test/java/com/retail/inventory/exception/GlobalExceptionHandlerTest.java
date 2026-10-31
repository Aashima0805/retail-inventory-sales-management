package com.retail.inventory.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handleValidation_ShouldReturn400WithFieldErrors() throws Exception {
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(new Object(), "loginRequest");
        bindingResult.addError(new FieldError("loginRequest", "username", "must not be blank"));
        bindingResult.addError(new FieldError("loginRequest", "password", "must not be blank"));

        var ex = buildMethodArgumentNotValidException(bindingResult);
        ProblemDetail problem = handler.handleValidation(ex);

        assertEquals(400, problem.getStatus());
        assertEquals("Validation Failed", problem.getTitle());
        assertNotNull(problem.getProperties());
        assertTrue(problem.getProperties().containsKey("fieldErrors"));
        assertFalse(problem.getProperties().get("fieldErrors").toString().contains("password_hash"),
                "Validation error must not expose password hash");
    }

    @Test
    void handleResourceNotFound_ShouldReturn404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("User not found: ghost");
        ProblemDetail problem = handler.handleResourceNotFound(ex);

        assertEquals(404, problem.getStatus());
        assertEquals("User not found: ghost", problem.getDetail());
    }

    @Test
    void handleDuplicateResource_ShouldReturn409() {
        DuplicateResourceException ex =
                new DuplicateResourceException("Product with SKU 'BEV-001' already exists");
        ProblemDetail problem = handler.handleDuplicateResource(ex);

        assertEquals(409, problem.getStatus());
        assertEquals("Conflict", problem.getTitle());
        assertEquals("Product with SKU 'BEV-001' already exists", problem.getDetail());
        assertNotNull(problem.getProperties());
        assertTrue(problem.getProperties().containsKey("timestamp"));
    }

    @Test
    void handleResponseStatus_ShouldReturn401ForUnauthorized() {
        ResponseStatusException ex =
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");

        ProblemDetail problem = handler.handleResponseStatus(ex);

        assertEquals(401, problem.getStatus());
        assertEquals("Invalid username or password", problem.getDetail());
    }

    @Test
    void handleAuthentication_ShouldReturn401() {
        AuthenticationException ex = new UsernameNotFoundException("User not found");
        ProblemDetail problem = handler.handleAuthentication(ex);

        assertEquals(401, problem.getStatus());
        assertEquals("Unauthorized", problem.getTitle());
        // Must not leak the internal exception message
        assertFalse(problem.getDetail().toLowerCase().contains("user not found"),
                "Handler must not expose internal exception details");
    }

    @Test
    void handleAccessDenied_ShouldReturn403() {
        AccessDeniedException ex = new AccessDeniedException("Forbidden");
        ProblemDetail problem = handler.handleAccessDenied(ex);

        assertEquals(403, problem.getStatus());
        assertEquals("Forbidden", problem.getTitle());
    }

    @Test
    void handleUnexpected_ShouldReturn500WithGenericMessage() {
        Exception ex = new RuntimeException("Database connection refused: password=supersecret");
        ProblemDetail problem = handler.handleUnexpected(ex);

        assertEquals(500, problem.getStatus());
        assertEquals("Internal Server Error", problem.getTitle());
        // The SQL / internal detail must not appear in the response
        assertFalse(problem.getDetail().contains("password=supersecret"),
                "Unexpected error handler must not leak internal details");
        assertFalse(problem.getDetail().contains("Database connection refused"),
                "Unexpected error handler must not leak SQL details");
    }

    @Test
    void allHandlers_ShouldIncludeTimestamp() {
        ResourceNotFoundException ex = new ResourceNotFoundException("Not found");
        ProblemDetail problem = handler.handleResourceNotFound(ex);

        assertNotNull(problem.getProperties());
        assertTrue(problem.getProperties().containsKey("timestamp"),
                "ProblemDetail should include a timestamp property");
    }

    // -----------------------------------------------------------------------
    // Helper to create MethodArgumentNotValidException without a real method
    // -----------------------------------------------------------------------
    private MethodArgumentNotValidException buildMethodArgumentNotValidException(
            BeanPropertyBindingResult bindingResult) throws Exception {

        // Reflectively construct since the public constructor requires a MethodParameter
        try {
            // Spring 6 / Boot 3 constructor: (MethodParameter, BindingResult)
            var ctor = MethodArgumentNotValidException.class
                    .getConstructor(
                            org.springframework.core.MethodParameter.class,
                            org.springframework.validation.BindingResult.class
                    );
            // Build a minimal MethodParameter for a dummy method
            java.lang.reflect.Method m = Object.class.getMethod("toString");
            var mp = new org.springframework.core.MethodParameter(m, -1);
            return ctor.newInstance(mp, bindingResult);
        } catch (Exception e) {
            throw new RuntimeException("Could not construct MethodArgumentNotValidException for test", e);
        }
    }
}
