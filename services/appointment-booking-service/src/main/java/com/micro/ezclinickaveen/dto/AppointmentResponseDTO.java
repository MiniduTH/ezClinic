package com.micro.ezclinickaveen.dto;

import java.math.BigDecimal;
import java.util.Date;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AppointmentResponseDTO {
    private UUID id;
    private String patientId;
    private String doctorId;
    private Date appointmentDate;
    private String status;
    private String type;
    private String paymentStatus;
    private BigDecimal amountPaid;
    private Date createdAt;
}
