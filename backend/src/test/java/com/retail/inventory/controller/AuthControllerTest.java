package com.retail.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.retail.inventory.config.SecurityConfig;
import com.retail.inventory.dto.CurrentUserResponse;
import com.retail.inventory.dto.LoginRequest;
import com.retail.inventory.dto.LoginResponse;
import com.retail.inventory.entity.Role;
import com.retail.inventory.entity.RoleName;
import com.retail.inventory.entity.User;
import com.retail.inventory.exception.GlobalExceptionHandler;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.CustomUserDetails;
import com.retail.inventory.security.JwtAuthenticationEntryPoint;
import com.retail.inventory.security.JwtAuthenticationFilter;
import com.retail.inventory.security.JwtTokenProvider;
import com.retail.inventory.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * WebMvcTest for AuthController.
 * Imports SecurityConfig and all real security beans so the JWT filter chain
 * is exercised end-to-end. AuthService is mocked.
 */
@WebMvcTest(controllers = AuthController.class)
@Import({
        AuthControllerTest.TestJwtBeans.class,
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtAuthenticationEntryPoint.class,
        GlobalExceptionHandler.class
})
class AuthControllerTest {

    // -----------------------------------------------------------------------
    // Inner TestConfiguration – provides real JwtTokenProvider with a test secret
    // -----------------------------------------------------------------------

    @TestConfiguration
    static class TestJwtBeans {
        // 256-bit Base64 secret – only for tests
        private static final String TEST_SECRET =
                Base64.getEncoder().encodeToString("TestSecretKeyForJwtTokenProvider1234".getBytes());

        @Bean
        public JwtTokenProvider jwtTokenProvider() {
            return new JwtTokenProvider(TEST_SECRET, 3_600_000L); // 1 hour
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    // Mock these so JwtAuthenticationFilter can be constructed but
    // UserRepository is controlled per-test
    @MockBean
    private UserRepository userRepository;

    // AuthService is the main mock for controller logic
    @MockBean
    private AuthService authService;

    // Shared fixtures
    private Role adminRole;
    private User activeAdminUser;

    @BeforeEach
    void setUp() {
        adminRole = new Role(1L, RoleName.ADMIN);

        activeAdminUser = new User();
        activeAdminUser.setId(1L);
        activeAdminUser.setUsername("admin");
        activeAdminUser.setPasswordHash("$2a$10$hashed");
        activeAdminUser.setFullName("Store Manager");
        activeAdminUser.setRole(adminRole);
        activeAdminUser.setIsActive(true);
        activeAdminUser.setTokenVersion(1);
    }

    // -----------------------------------------------------------------------
    // Helper: build a valid Bearer header for a given user
    // -----------------------------------------------------------------------
    private String bearerHeader(User user) {
        String token = jwtTokenProvider.generateToken(
                user.getUsername(),
                user.getTokenVersion(),
                user.getRole().getName()
        );
        return "Bearer " + token;
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/auth/login (public endpoint)
    // -----------------------------------------------------------------------

    @Test
    void login_ShouldReturn200WithToken_WhenCredentialsAreValid() throws Exception {
        LoginResponse loginResponse = new LoginResponse(
                "mocked.jwt.token", 1L, "admin", "Store Manager", RoleName.ADMIN);

        when(authService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.fullName").value("Store Manager"))
                .andExpect(jsonPath("$.role").value(RoleName.ADMIN));
    }

    @Test
    void login_ShouldReturn401_WhenPasswordIsIncorrect() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin", "wrongpass"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_ShouldReturn401_WhenUsernameDoesNotExist() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("ghost", "password123"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_ShouldReturn401_WhenAccountIsInactive() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account is inactive"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("inactive_user", "password123"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_ShouldReturn400_WhenRequestBodyIsInvalid() throws Exception {
        // Blank username and password fail Bean Validation
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("", ""))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_ShouldNotReturnPasswordHash_InResponse() throws Exception {
        LoginResponse loginResponse = new LoginResponse(
                "tok", 1L, "admin", "Store Manager", RoleName.ADMIN);

        when(authService.login(any(LoginRequest.class))).thenReturn(loginResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("admin", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    // -----------------------------------------------------------------------
    // POST /api/v1/auth/logout (authenticated endpoint)
    // -----------------------------------------------------------------------

    @Test
    void logout_ShouldReturn204_WhenAuthenticatedWithValidJwt() throws Exception {
        // JWT filter looks up user in DB
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(activeAdminUser));
        doNothing().when(authService).logout(any(CustomUserDetails.class));

        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", bearerHeader(activeAdminUser)))
                .andExpect(status().isNoContent());

        verify(authService).logout(any(CustomUserDetails.class));
    }

    @Test
    void logout_ShouldIncrementTokenVersion_ThroughService() throws Exception {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(activeAdminUser));
        doNothing().when(authService).logout(any(CustomUserDetails.class));

        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", bearerHeader(activeAdminUser)))
                .andExpect(status().isNoContent());

        // Service is responsible for incrementing token_version
        verify(authService, times(1)).logout(any(CustomUserDetails.class));
    }

    @Test
    void logout_ShouldReturn401_WhenNoJwtProvided() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isUnauthorized());

        verify(authService, never()).logout(any());
    }

    @Test
    void logout_ShouldReturn401_WhenOldJwtUsedAfterTokenVersionIncrement() throws Exception {
        // Token carries version=1 but DB now has version=2 (after a previous logout)
        String oldToken = jwtTokenProvider.generateToken("admin", 1, RoleName.ADMIN);

        User userAfterLogout = new User();
        userAfterLogout.setId(1L);
        userAfterLogout.setUsername("admin");
        userAfterLogout.setPasswordHash("$2a$10$hashed");
        userAfterLogout.setFullName("Store Manager");
        userAfterLogout.setRole(adminRole);
        userAfterLogout.setIsActive(true);
        userAfterLogout.setTokenVersion(2); // incremented by logout

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(userAfterLogout));

        // JwtAuthenticationFilter rejects: version mismatch → 401
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isUnauthorized());

        verify(authService, never()).logout(any());
    }

    // -----------------------------------------------------------------------
    // GET /api/v1/auth/me (authenticated endpoint)
    // -----------------------------------------------------------------------

    @Test
    void me_ShouldReturn200WithUserDetails_WhenAuthenticated() throws Exception {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(activeAdminUser));

        CurrentUserResponse currentUser =
                new CurrentUserResponse(1L, "admin", "Store Manager", RoleName.ADMIN);
        when(authService.getCurrentUser(any(CustomUserDetails.class))).thenReturn(currentUser);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", bearerHeader(activeAdminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(1L))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.fullName").value("Store Manager"))
                .andExpect(jsonPath("$.role").value(RoleName.ADMIN));
    }

    @Test
    void me_ShouldReturn401_WhenUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());

        verify(authService, never()).getCurrentUser(any());
    }

    @Test
    void me_ShouldNotExposePasswordHash() throws Exception {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(activeAdminUser));

        CurrentUserResponse currentUser =
                new CurrentUserResponse(1L, "admin", "Store Manager", RoleName.ADMIN);
        when(authService.getCurrentUser(any(CustomUserDetails.class))).thenReturn(currentUser);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", bearerHeader(activeAdminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    // -----------------------------------------------------------------------
    // Unauthenticated access to protected endpoints returns 401
    // -----------------------------------------------------------------------

    @Test
    void protectedEndpoints_ShouldReturn401_WhenNoCredentialsSupplied() throws Exception {
        // /api/v1/auth/logout
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isUnauthorized());

        // /api/v1/auth/me
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "mockuser", roles = "ADMIN")
    void me_ShouldReturn200_WithSpringMockUser() throws Exception {
        // Spring's @WithMockUser bypasses JWT — principal won't be CustomUserDetails.
        // authService.getCurrentUser receives null; we stub it to return a response.
        when(authService.getCurrentUser(any())).thenReturn(
                new CurrentUserResponse(99L, "mockuser", "Mock User", "ROLE_ADMIN"));

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk());
    }
}
