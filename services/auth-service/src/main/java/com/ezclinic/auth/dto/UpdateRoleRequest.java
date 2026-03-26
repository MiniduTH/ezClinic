package com.ezclinic.auth.dto;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateRoleRequest {

    @Pattern(regexp = "^(PATIENT|DOCTOR|ADMIN)$", message = "Role must be PATIENT, DOCTOR, or ADMIN")
    private String role;
}
