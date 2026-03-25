package com.ezclinic.auth.service;

import com.ezclinic.auth.dto.UpdateRoleRequest;
import com.ezclinic.auth.dto.UserDto;
import com.ezclinic.auth.model.User;
import com.ezclinic.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    public Page<UserDto> getAllUsers(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return userRepository.findAll(pageRequest).map(UserDto::fromEntity);
    }

    public UserDto getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        return UserDto.fromEntity(user);
    }

    public UserDto updateRole(UUID id, UpdateRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        user.setRole(User.Role.valueOf(request.getRole()));
        User saved = userRepository.save(user);
        log.info("User {} role updated to {}", saved.getEmail(), saved.getRole());
        return UserDto.fromEntity(saved);
    }
}
