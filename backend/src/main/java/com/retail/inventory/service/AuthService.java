package com.retail.inventory.service;

import com.retail.inventory.dto.CurrentUserResponse;
import com.retail.inventory.dto.LoginRequest;
import com.retail.inventory.dto.LoginResponse;
import com.retail.inventory.entity.User;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.CustomUserDetails;
import com.retail.inventory.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles authentication operations: login, logout, and current-user retrieval.
 * Role information is always sourced from the database, never from the client.
 */
@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Authenticates the user with username and password.
     * Returns a LoginResponse containing the JWT and safe user details.
     * Rejects invalid credentials with HTTP 401 and inactive accounts with HTTP 403.
     *
     * @param request the login request containing username and password
     * @return LoginResponse with token and safe user info
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // Lookup user — do not reveal whether user exists or password is wrong (use same error)
        User user = userRepository.findByUsername(request.getUsername())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            logger.warn("Authentication failed for username: {}", request.getUsername());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            logger.warn("Login rejected: account is inactive for username: {}", request.getUsername());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account is inactive");
        }

        String role = user.getRole().getName();
        String token = jwtTokenProvider.generateToken(
                user.getUsername(),
                user.getTokenVersion(),
                role
        );

        logger.info("User authenticated successfully: {}", user.getUsername());

        return new LoginResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                role
        );
    }

    /**
     * Invalidates the current user's JWT by incrementing their token_version in the database.
     * Any previously issued JWT that carries the old token_version will be rejected by the filter.
     *
     * @param userDetails the currently authenticated user
     */
    @Transactional
    public void logout(CustomUserDetails userDetails) {
        String username = userDetails.getUsername();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        logger.info("User logged out (token revoked) for username: {}", username);
    }

    /**
     * Returns safe profile information for the currently authenticated user.
     *
     * @param userDetails the currently authenticated user
     * @return CurrentUserResponse with non-sensitive user details
     */
    public CurrentUserResponse getCurrentUser(CustomUserDetails userDetails) {
        String role = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("UNKNOWN");

        return new CurrentUserResponse(
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getFullName(),
                role
        );
    }
}
