package com.micro.ezclinickaveen.controller;

import com.micro.ezclinickaveen.dto.PayHereDTO;
import com.micro.ezclinickaveen.service.PaymentWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentWebhookService paymentWebhookService;

    @GetMapping("/checkout-params/{appointmentId}")
    public ResponseEntity<PayHereDTO> getCheckoutParams(@PathVariable UUID appointmentId) {
        return ResponseEntity.ok(paymentWebhookService.getCheckoutParams(appointmentId));
    }

    // Since PayHere sends POST requests with form-data (x-www-form-urlencoded), we must intercept a map.
    @PostMapping("/payhere/notify")
    public ResponseEntity<String> payHereWebhook(@RequestParam Map<String, String> payload) {
        try {
            paymentWebhookService.processPayHereNotification(payload);
            return ResponseEntity.ok("OK");
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body("Invalid signature");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing webhook");
        }
    }
}
