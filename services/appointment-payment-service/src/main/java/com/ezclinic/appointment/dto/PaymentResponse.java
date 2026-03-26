package com.ezclinic.appointment.dto;

import com.ezclinic.appointment.model.Payment;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentResponse {
    private UUID id;
    private UUID appointmentId;
    private BigDecimal amount;
    private String status;
    private String transactionId;
    private String stripeSessionId;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;

    public static PaymentResponse fromEntity(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId()).appointmentId(p.getAppointment().getId())
                .amount(p.getAmount()).status(p.getStatus().name())
                .transactionId(p.getTransactionId()).stripeSessionId(p.getStripeSessionId())
                .paidAt(p.getPaidAt()).createdAt(p.getCreatedAt()).build();
    }
}
