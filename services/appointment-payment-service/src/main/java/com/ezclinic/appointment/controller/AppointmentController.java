package com.ezclinic.appointment.controller;

import com.ezclinic.appointment.dto.*;
import com.ezclinic.appointment.service.AppointmentService;
import com.ezclinic.appointment.service.DoctorServiceClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController @RequestMapping("/appointments") @RequiredArgsConstructor
@Tag(name = "Appointments", description = "Booking, scheduling, and appointment management")
public class AppointmentController {
    private final AppointmentService appointmentService;
    private final DoctorServiceClient doctorServiceClient;

    @GetMapping("/doctors")
    @Operation(summary = "Search doctors by specialization (proxies doctor-service)")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchDoctors(
            @RequestParam(required = false) String specialization, @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success("Doctors retrieved",
                doctorServiceClient.searchDoctors(specialization, search, page, limit)));
    }

    @GetMapping("/doctors/{doctorId}/availability")
    @Operation(summary = "Get doctor availability slots")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDoctorAvailability(@PathVariable String doctorId) {
        return ResponseEntity.ok(ApiResponse.success("Availability retrieved",
                doctorServiceClient.getDoctorAvailability(doctorId)));
    }

    @PostMapping
    @Operation(summary = "Book a new appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> create(
            @RequestAttribute("tokenSub") String tokenSub, @Valid @RequestBody CreateAppointmentRequest request) {
        String patientId = tokenSub;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appointment booked", appointmentService.createAppointment(patientId, request)));
    }

    @GetMapping("/my")
    @Operation(summary = "List my appointments (patient)")
    public ResponseEntity<ApiResponse<Page<AppointmentResponse>>> getMyAppointments(
            @RequestAttribute("tokenSub") String tokenSub, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        String patientId = tokenSub;
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved",
                appointmentService.getPatientAppointments(patientId, page, size)));
    }

    @GetMapping
    @Operation(summary = "List my appointments (patient) — alias for /my")
    public ResponseEntity<ApiResponse<Page<AppointmentResponse>>> getAppointments(
            @RequestAttribute("tokenSub") String tokenSub, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        String patientId = tokenSub;
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved",
                appointmentService.getPatientAppointments(patientId, page, size)));
    }

    @GetMapping("/doctor")
    @Operation(summary = "List appointments (doctor view)")
    public ResponseEntity<ApiResponse<Page<AppointmentResponse>>> getDoctorAppointments(
            @RequestAttribute("tokenSub") String tokenSub, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        String doctorId = tokenSub;
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved",
                appointmentService.getDoctorAppointments(doctorId, page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get specific appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Appointment retrieved", appointmentService.getAppointment(id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modify appointment (patient)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> update(
            @PathVariable UUID id, @RequestAttribute("tokenSub") String tokenSub, @RequestBody UpdateAppointmentRequest request) {
        String patientId = tokenSub;
        return ResponseEntity.ok(ApiResponse.success("Appointment updated",
                appointmentService.updateAppointment(id, patientId, request)));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancel(@PathVariable UUID id, @RequestAttribute("tokenSub") String tokenSub) {
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled",
                appointmentService.cancelAppointment(id, tokenSub)));
    }

    @PatchMapping("/{id}/reschedule")
    @Operation(summary = "Reschedule appointment")
    public ResponseEntity<ApiResponse<AppointmentResponse>> reschedule(
            @PathVariable UUID id, @RequestAttribute("tokenSub") String tokenSub, @RequestBody UpdateAppointmentRequest request) {
        String patientId = tokenSub;
        return ResponseEntity.ok(ApiResponse.success("Appointment rescheduled",
                appointmentService.updateAppointment(id, patientId, request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update appointment status (doctor — CONFIRMED/COMPLETED)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(
            @PathVariable UUID id, @RequestAttribute("tokenSub") String tokenSub, @RequestParam String status) {
        String doctorId = tokenSub;
        return ResponseEntity.ok(ApiResponse.success("Status updated to " + status,
                appointmentService.updateStatus(id, status, doctorId)));
    }
}
