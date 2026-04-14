package com.micro.ezclinickaveen.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;
import java.util.UUID;

@Data
@Builder
public class AppointmentResponseDTO {
    private UUID id;
    private UUID patientId;
    private UUID doctorId;
    private Date appointmentDate;
    private String status;
    private String type;
    private String paymentStatus;
    private BigDecimal amountPaid;
    private Date createdAt;
}
