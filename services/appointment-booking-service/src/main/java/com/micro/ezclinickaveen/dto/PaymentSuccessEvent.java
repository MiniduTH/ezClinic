package com.micro.ezclinickaveen.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;
import java.util.UUID;

import java.io.Serializable;

@Data
@Builder
public class PaymentSuccessEvent implements Serializable {
    private UUID appointmentId;
    private UUID patientId;
    private UUID doctorId;
    private Date appointmentDate;
    private BigDecimal amountPaid;
    private String receiptNo;
}
