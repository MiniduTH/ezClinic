package com.ezclinic.appointment.controller;

import com.ezclinic.appointment.dto.ApiResponse;
import com.ezclinic.appointment.dto.PayHereHashResponse;
import com.ezclinic.appointment.dto.PaymentResponse;
import com.ezclinic.appointment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/payments") @RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing via PayHere")
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping("/checkout/{appointmentId}")
    @Operation(summary = "Generate PayHere checkout hash")
    public ResponseEntity<ApiResponse<PayHereHashResponse>> generateHash(
            @PathVariable UUID appointmentId, @RequestParam BigDecimal amount) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Checkout hash generated", paymentService.generatePayHereHash(appointmentId, amount)));
    }

    @PostMapping(value = "/notify", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @Operation(summary = "PayHere webhook notify handler")
    public ResponseEntity<String> handleNotify(@RequestParam Map<String, String> payload) {
        paymentService.handlePayHereNotify(payload);
        return ResponseEntity.ok("Webhook processed");
    }

    @GetMapping("/{appointmentId}")
    @Operation(summary = "Get payment status")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(@PathVariable UUID appointmentId) {
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved", paymentService.getPaymentByAppointment(appointmentId)));
    }
}
