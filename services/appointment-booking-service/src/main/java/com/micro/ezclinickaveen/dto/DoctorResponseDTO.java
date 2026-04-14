package com.micro.ezclinickaveen.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class DoctorResponseDTO {
    private UUID id;
    private String name;
    private String specialization;
    private String hospital;
    private Double consultationFee;
}
