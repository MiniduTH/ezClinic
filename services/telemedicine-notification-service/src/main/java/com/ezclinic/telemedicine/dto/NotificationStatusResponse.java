package com.ezclinic.telemedicine.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class NotificationStatusResponse {
    private String appointmentId;
    private boolean emailSent;
    private Instant emailSentAt;
}
