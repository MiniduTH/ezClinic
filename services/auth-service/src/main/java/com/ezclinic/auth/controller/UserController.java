package com.ezclinic.auth.controller;

import com.ezclinic.auth.dto.*;
import com.ezclinic.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Admin-only user management endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    @Operation(summary = "List all users (Admin only)")
    public ResponseEntity<ApiResponse<Page<UserDto>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", userService.getAllUsers(page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    @Operation(summary = "Get a user by ID (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("User retrieved", userService.getUserById(id)));
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasAuthority('SCOPE_admin')")
    @Operation(summary = "Update user role (Admin only)")
    public ResponseEntity<ApiResponse<UserDto>> updateRole(
            @PathVariable UUID id, @Valid @RequestBody UpdateRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User role updated", userService.updateRole(id, request)));
    }
}
