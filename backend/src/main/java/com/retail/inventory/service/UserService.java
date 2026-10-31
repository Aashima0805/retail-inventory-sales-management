package com.retail.inventory.service;

import com.retail.inventory.dto.CreateStaffRequest;
import com.retail.inventory.dto.StaffUserResponse;
import com.retail.inventory.entity.Role;
import com.retail.inventory.entity.RoleName;
import com.retail.inventory.entity.User;
import com.retail.inventory.exception.DuplicateResourceException;
import com.retail.inventory.exception.ResourceNotFoundException;
import com.retail.inventory.repository.RoleRepository;
import com.retail.inventory.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    private static final List<String> ALLOWED_ROLES = Arrays.asList(
            RoleName.ADMIN,
            RoleName.CASHIER,
            RoleName.INVENTORY_STAFF
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<StaffUserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(StaffUserResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public StaffUserResponse getUserById(Long id) {
        return userRepository.findById(id)
                .map(StaffUserResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    @Transactional
    public StaffUserResponse createUser(CreateStaffRequest request) {
        String trimmedUsername = request.getUsername().trim();
        if (userRepository.existsByUsername(trimmedUsername)) {
            logger.warn("Staff account creation failed: username '{}' already exists", trimmedUsername);
            throw new DuplicateResourceException("Username already exists: " + trimmedUsername);
        }

        String normalizedRole = request.getRole().trim().toUpperCase();
        if (!normalizedRole.startsWith("ROLE_")) {
            normalizedRole = "ROLE_" + normalizedRole;
        }

        if (!ALLOWED_ROLES.contains(normalizedRole)) {
            logger.warn("Staff account creation failed: invalid role '{}'", request.getRole());
            throw new IllegalArgumentException("Invalid role: " + request.getRole()
                    + ". Allowed roles: ROLE_ADMIN, ROLE_CASHIER, ROLE_INVENTORY_STAFF");
        }

        final String targetRole = normalizedRole;
        Role role = roleRepository.findByName(targetRole)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found in database: " + targetRole));

        User user = new User();
        user.setUsername(trimmedUsername);
        user.setFullName(request.getFullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setIsActive(true);
        user.setTokenVersion(1);

        User saved = userRepository.save(user);
        logger.info("Created new staff account '{}' with role '{}'", saved.getUsername(), role.getName());
        return StaffUserResponse.fromEntity(saved);
    }

    @Transactional
    public StaffUserResponse deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setIsActive(false);
        user.setTokenVersion(user.getTokenVersion() + 1); // Invalidate existing sessions
        User saved = userRepository.save(user);
        logger.info("Deactivated staff account '{}' (id={})", saved.getUsername(), id);
        return StaffUserResponse.fromEntity(saved);
    }

    @Transactional
    public StaffUserResponse activateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setIsActive(true);
        User saved = userRepository.save(user);
        logger.info("Activated staff account '{}' (id={})", saved.getUsername(), id);
        return StaffUserResponse.fromEntity(saved);
    }
}
