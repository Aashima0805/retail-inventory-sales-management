package com.retail.inventory.controller;

import com.retail.inventory.dto.CurrentUserResponse;
import com.retail.inventory.dto.LoginRequest;
import com.retail.inventory.dto.LoginResponse;
import com.retail.inventory.security.CustomUserDetails;
import com.retail.inventory.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication REST controller.
 *
 * <ul>
 *   <li>POST /api/v1/auth/login  – public (permitted in SecurityConfig)</li>
 *   <li>POST /api/v1/auth/logout – requires valid JWT</li>
 *   <li>GET  /api/v1/auth/me     – requires valid JWT</li>
 * </ul>
 *
 * Role information is never accepted from the client; it is always sourced from the database.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Authenticate with username and password.
     * Returns a JWT token and safe user details on success.
     *
     * @param request login credentials (validated)
     * @return 200 OK with LoginResponse, or 401 if credentials are invalid / account inactive
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Invalidate the caller's JWT by incrementing token_version in the database.
     * Subsequent requests using the old token will be rejected by the JwtAuthenticationFilter.
     *
     * @param userDetails the currently authenticated user (injected by Spring Security)
     * @return 204 No Content on success
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal CustomUserDetails userDetails) {
        authService.logout(userDetails);
        return ResponseEntity.noContent().build();
    }

    /**
     * Return the profile of the currently authenticated user.
     * Never returns the password hash or any other secret.
     *
     * @param userDetails the currently authenticated user (injected by Spring Security)
     * @return 200 OK with CurrentUserResponse
     */
    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        CurrentUserResponse response = authService.getCurrentUser(userDetails);
        return ResponseEntity.ok(response);
    }
}
