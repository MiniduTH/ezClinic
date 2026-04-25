package com.micro.ezclinickaveen.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentSuccessEvent implements Serializable {
    @Builder.Default
    private String eventType = "PAYMENT_COMPLETED";
    private UUID appointmentId;
    private String patientId;
    private String doctorId;
    private Date appointmentDate;
    private BigDecimal amountPaid;
    private String receiptNo;
}
