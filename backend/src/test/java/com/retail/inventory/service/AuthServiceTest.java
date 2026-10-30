package com.retail.inventory.service;

import com.retail.inventory.dto.CurrentUserResponse;
import com.retail.inventory.dto.LoginRequest;
import com.retail.inventory.dto.LoginResponse;
import com.retail.inventory.entity.Role;
import com.retail.inventory.entity.RoleName;
import com.retail.inventory.entity.User;
import com.retail.inventory.repository.UserRepository;
import com.retail.inventory.security.CustomUserDetails;
import com.retail.inventory.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    private AuthService authService;

    // Shared test fixtures
    private Role adminRole;
    private User activeUser;

    private static final String RAW_PASSWORD = "password123";
    private static final String HASHED_PASSWORD = "$2a$10$hashedPasswordValue";
    private static final String FAKE_JWT = "header.payload.signature";

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtTokenProvider);

        adminRole = new Role(1L, RoleName.ADMIN);

        activeUser = new User();
        activeUser.setId(1L);
        activeUser.setUsername("admin");
        activeUser.setPasswordHash(HASHED_PASSWORD);
        activeUser.setFullName("Store Manager");
        activeUser.setRole(adminRole);
        activeUser.setIsActive(true);
        activeUser.setTokenVersion(1);
    }

    // -----------------------------------------------------------------------
    // Login: success
    // -----------------------------------------------------------------------

    @Test
    void login_ShouldReturnTokenAndSafeDetails_WhenCredentialsAreValid() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(RAW_PASSWORD, HASHED_PASSWORD)).thenReturn(true);
        when(jwtTokenProvider.generateToken("admin", 1, RoleName.ADMIN)).thenReturn(FAKE_JWT);

        LoginRequest request = new LoginRequest("admin", RAW_PASSWORD);
        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals(FAKE_JWT, response.getToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(1L, response.getUserId());
        assertEquals("admin", response.getUsername());
        assertEquals("Store Manager", response.getFullName());
        assertEquals(RoleName.ADMIN, response.getRole());

        verify(jwtTokenProvider).generateToken("admin", 1, RoleName.ADMIN);
    }

    @Test
    void login_ResponseShouldNeverContainPasswordHash() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(RAW_PASSWORD, HASHED_PASSWORD)).thenReturn(true);
        when(jwtTokenProvider.generateToken(anyString(), anyInt(), anyString())).thenReturn(FAKE_JWT);

        LoginResponse response = authService.login(new LoginRequest("admin", RAW_PASSWORD));

        // Verify toString() does not leak the token or hash
        String str = response.toString();
        assertFalse(str.contains(FAKE_JWT), "toString() must not expose the JWT value");
        assertFalse(str.contains(HASHED_PASSWORD), "toString() must not expose the password hash");
    }

    // -----------------------------------------------------------------------
    // Login: wrong password
    // -----------------------------------------------------------------------

    @Test
    void login_ShouldThrow401_WhenPasswordIsIncorrect() {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongPassword", HASHED_PASSWORD)).thenReturn(false);

        LoginRequest request = new LoginRequest("admin", "wrongPassword");

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> authService.login(request)
        );

        assertEquals(401, ex.getStatusCode().value());
        verify(jwtTokenProvider, never()).generateToken(anyString(), anyInt(), anyString());
    }

    // -----------------------------------------------------------------------
    // Login: unknown username
    // -----------------------------------------------------------------------

    @Test
    void login_ShouldThrow401_WhenUsernameDoesNotExist() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("ghost", RAW_PASSWORD);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> authService.login(request)
        );

        assertEquals(401, ex.getStatusCode().value());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(jwtTokenProvider, never()).generateToken(anyString(), anyInt(), anyString());
    }

    // -----------------------------------------------------------------------
    // Login: inactive account
    // -----------------------------------------------------------------------

    @Test
    void login_ShouldThrow401_WhenUserIsInactive() {
        activeUser.setIsActive(false);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(RAW_PASSWORD, HASHED_PASSWORD)).thenReturn(true);

        LoginRequest request = new LoginRequest("admin", RAW_PASSWORD);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> authService.login(request)
        );

        assertEquals(401, ex.getStatusCode().value());
        verify(jwtTokenProvider, never()).generateToken(anyString(), anyInt(), anyString());
    }

    // -----------------------------------------------------------------------
    // Logout: token_version incremented
    // -----------------------------------------------------------------------

    @Test
    void logout_ShouldIncrementTokenVersion() {
        CustomUserDetails userDetails = new CustomUserDetails(activeUser);
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(activeUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.logout(userDetails);

        // token_version must have been incremented from 1 to 2
        verify(userRepository).save(argThat(u -> u.getTokenVersion() == 2));
    }

    @Test
    void logout_ShouldIncrementTokenVersion_VerifyExactValue() {
        activeUser.setTokenVersion(5);
        CustomUserDetails userDetails = new CustomUserDetails(activeUser);

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(activeUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.logout(userDetails);

        assertEquals(6, activeUser.getTokenVersion());
    }

    // -----------------------------------------------------------------------
    // getCurrentUser
    // -----------------------------------------------------------------------

    @Test
    void getCurrentUser_ShouldReturnSafeDetailsFromPrincipal() {
        CustomUserDetails userDetails = new CustomUserDetails(activeUser);

        CurrentUserResponse response = authService.getCurrentUser(userDetails);

        assertNotNull(response);
        assertEquals(1L, response.getUserId());
        assertEquals("admin", response.getUsername());
        assertEquals("Store Manager", response.getFullName());
        assertEquals(RoleName.ADMIN, response.getRole());
    }

    @Test
    void getCurrentUser_ShouldNeverExposePasswordHash() {
        CustomUserDetails userDetails = new CustomUserDetails(activeUser);

        CurrentUserResponse response = authService.getCurrentUser(userDetails);

        // Validate password hash is not part of the response DTO at all
        assertNull(getPasswordHashFieldValue(response),
                "CurrentUserResponse must not have a passwordHash field");
    }

    /**
     * Reflectively checks that the CurrentUserResponse has no field containing the hash.
     * Returns null if no such field exists (expected), otherwise returns the field value.
     */
    private String getPasswordHashFieldValue(CurrentUserResponse response) {
        try {
            var field = response.getClass().getDeclaredField("passwordHash");
            field.setAccessible(true);
            return (String) field.get(response);
        } catch (NoSuchFieldException e) {
            return null; // Good – no such field
        } catch (IllegalAccessException e) {
            return null;
        }
    }
}
