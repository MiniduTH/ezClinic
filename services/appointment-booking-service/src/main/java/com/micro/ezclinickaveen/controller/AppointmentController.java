package com.micro.ezclinickaveen.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.micro.ezclinickaveen.dto.AppointmentRequestDTO;
import com.micro.ezclinickaveen.dto.AppointmentResponseDTO;
import com.micro.ezclinickaveen.dto.DoctorResponseDTO;
import com.micro.ezclinickaveen.dto.RescheduleRequestDTO;
import com.micro.ezclinickaveen.service.AppointmentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping({"/api/appointments", "/api/v1/appointments"})
@RequiredArgsConstructor
@Slf4j
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponseDTO> bookAppointment(@Valid @RequestBody AppointmentRequestDTO requestDTO) {
        return new ResponseEntity<>(appointmentService.bookAppointment(requestDTO), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponseDTO> getAppointment(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.getAppointment(id));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getPatientAppointments(@PathVariable String patientId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByPatient(patientId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<AppointmentResponseDTO> cancelAppointment(@PathVariable UUID id) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id));
    }

    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponseDTO> rescheduleAppointment(
            @PathVariable UUID id,
            @Valid @RequestBody RescheduleRequestDTO requestDTO) {
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(id, requestDTO));
    }

    @GetMapping("/doctors/search")
    public ResponseEntity<List<DoctorResponseDTO>> searchDoctors(
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false) String hospital) {
        return ResponseEntity.ok(appointmentService.searchDoctors(specialty, hospital));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getDoctorAppointments(@PathVariable String doctorId) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByDoctor(doctorId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponseDTO> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> requestData) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, requestData.get("status")));
    }
}
