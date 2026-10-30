package com.retail.inventory.security;

import com.retail.inventory.entity.Role;
import com.retail.inventory.entity.RoleName;
import com.retail.inventory.entity.User;
import com.retail.inventory.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter authenticationFilter;

    @BeforeEach
    void setUp() {
        authenticationFilter = new JwtAuthenticationFilter(tokenProvider, userRepository);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_ShouldAuthenticateWhenTokenIsValidAndVersionMatches() throws ServletException, IOException {
        String token = "valid.jwt.token";
        String username = "alice";
        Integer tokenVersion = 1;

        Role role = new Role(1L, RoleName.ADMIN);
        User user = new User();
        user.setUsername(username);
        user.setPasswordHash("hashed_pw");
        user.setRole(role);
        user.setIsActive(true);
        user.setTokenVersion(tokenVersion);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(username);
        when(tokenProvider.getTokenVersionFromToken(token)).thenReturn(tokenVersion);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        authenticationFilter.doFilterInternal(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(username, SecurityContextHolder.getContext().getAuthentication().getName());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_ShouldRejectWhenTokenVersionMismatches() throws ServletException, IOException {
        String token = "old.jwt.token";
        String username = "alice";
        Integer oldTokenVersion = 1;

        Role role = new Role(1L, RoleName.ADMIN);
        User user = new User();
        user.setUsername(username);
        user.setRole(role);
        user.setIsActive(true);
        user.setTokenVersion(2); // Database has version 2 (user logged out previously)

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(username);
        when(tokenProvider.getTokenVersionFromToken(token)).thenReturn(oldTokenVersion);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        authenticationFilter.doFilterInternal(request, response, filterChain);

        // Security context should NOT be authenticated
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_ShouldRejectWhenUserIsInactive() throws ServletException, IOException {
        String token = "valid.jwt.token";
        String username = "deactivated_user";
        Integer tokenVersion = 1;

        Role role = new Role(2L, RoleName.CASHIER);
        User user = new User();
        user.setUsername(username);
        user.setRole(role);
        user.setIsActive(false); // Inactive
        user.setTokenVersion(tokenVersion);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(username);
        when(tokenProvider.getTokenVersionFromToken(token)).thenReturn(tokenVersion);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        authenticationFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_ShouldPassThroughWhenNoAuthorizationHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        authenticationFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(tokenProvider);
        verifyNoInteractions(userRepository);
    }
}
