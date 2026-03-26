package com.ezclinic.auth.dto;

import com.ezclinic.auth.model.User;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String auth0Id;
    private String name;
    private String email;
    private String role;
    private String phone;
    private LocalDateTime createdAt;

    public static UserDto fromEntity(User user) {
        return UserDto.builder()
                .id(user.getId())
                .auth0Id(user.getAuth0Id())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .phone(user.getPhone())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
