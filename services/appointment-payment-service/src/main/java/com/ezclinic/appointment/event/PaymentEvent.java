package com.ezclinic.appointment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentEvent implements Serializable {
    private String eventType;
    private UUID paymentId;
    private UUID appointmentId;
    private UUID patientId;
    private BigDecimal amount;
    private String status;
    private String transactionId;
    private LocalDateTime timestamp;
}
