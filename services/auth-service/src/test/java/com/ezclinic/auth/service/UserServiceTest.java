package com.ezclinic.auth.service;

import com.ezclinic.auth.dto.UpdateRoleRequest;
import com.ezclinic.auth.dto.UserDto;
import com.ezclinic.auth.model.User;
import com.ezclinic.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private UserService userService;

    private User testUser;
    private UUID testId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        testUser = User.builder().id(testId).auth0Id("auth0|12345")
                .name("Kaveen").email("kaveen@test.com").role(User.Role.PATIENT)
                .createdAt(LocalDateTime.now()).build();
    }

    @Test @DisplayName("getAllUsers — should return paginated users")
    void getAllUsers() {
        when(userRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(testUser)));
        Page<UserDto> result = userService.getAllUsers(0, 20);
        assertEquals(1, result.getTotalElements());
    }

    @Test @DisplayName("getUserById — should return user")
    void getUserById() {
        when(userRepository.findById(testId)).thenReturn(Optional.of(testUser));
        assertEquals("Kaveen", userService.getUserById(testId).getName());
    }

    @Test @DisplayName("getUserById — should throw when not found")
    void getUserByIdNotFound() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> userService.getUserById(id));
    }

    @Test @DisplayName("updateRole — should update successfully")
    void updateRole() {
        UpdateRoleRequest req = new UpdateRoleRequest(); req.setRole("DOCTOR");
        when(userRepository.findById(testId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any())).thenReturn(testUser);
        assertNotNull(userService.updateRole(testId, req));
        verify(userRepository).save(any());
    }
}
