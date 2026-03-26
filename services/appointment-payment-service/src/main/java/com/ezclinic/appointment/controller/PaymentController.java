package com.ezclinic.appointment.controller;

import com.ezclinic.appointment.dto.ApiResponse;
import com.ezclinic.appointment.dto.PaymentResponse;
import com.ezclinic.appointment.service.PaymentService;
import com.stripe.exception.StripeException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/payments") @RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing via Stripe")
public class PaymentController {
    private final PaymentService paymentService;

    @PostMapping("/checkout/{appointmentId}")
    @Operation(summary = "Create Stripe checkout session")
    public ResponseEntity<ApiResponse<Map<String, String>>> createCheckout(
            @PathVariable UUID appointmentId, @RequestParam BigDecimal amount) throws StripeException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Checkout session created", paymentService.createCheckoutSession(appointmentId, amount)));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Stripe webhook handler")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        paymentService.handleWebhook(payload, sigHeader);
        return ResponseEntity.ok("Webhook processed");
    }

    @GetMapping("/{appointmentId}")
    @Operation(summary = "Get payment status")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(@PathVariable UUID appointmentId) {
        return ResponseEntity.ok(ApiResponse.success("Payment retrieved", paymentService.getPaymentByAppointment(appointmentId)));
    }
}
