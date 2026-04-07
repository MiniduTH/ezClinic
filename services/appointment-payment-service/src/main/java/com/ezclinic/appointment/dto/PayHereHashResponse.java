package com.ezclinic.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayHereHashResponse {
    private String merchantId;
    private String orderId;
    private String amount;
    private String currency;
    private String hash;
}
