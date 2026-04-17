package com.ezclinic.appointment.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.Map;

@Service @Slf4j
public class DoctorServiceClient {
    private final WebClient webClient;

    public DoctorServiceClient(@Value("${services.doctor-service-url}") String doctorServiceUrl) {
        this.webClient = WebClient.builder().baseUrl(doctorServiceUrl).build();
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchDoctors(String specialization, String search, int page, int limit) {
        try {
            return webClient.get().uri(b -> {
                b.path("/doctors");
                if (specialization != null) b.queryParam("specialization", specialization);
                if (search != null) b.queryParam("search", search);
                b.queryParam("page", page).queryParam("limit", limit);
                return b.build();
            }).retrieve().bodyToMono(List.class).block();
        } catch (Exception e) {
            log.error("Failed to fetch doctors: {}", e.getMessage());
            throw new RuntimeException("Doctor service unavailable: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getDoctorAvailability(String doctorId) {
        try {
            return webClient.get().uri("/doctors/{id}/availability", doctorId)
                    .retrieve().bodyToMono(List.class).block();
        } catch (Exception e) {
            log.error("Failed to fetch availability: {}", e.getMessage());
            throw new RuntimeException("Doctor service unavailable: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getDoctorById(String doctorId) {
        try {
            return webClient.get().uri("/doctors/{id}", doctorId)
                    .retrieve().bodyToMono(Map.class).block();
        } catch (Exception e) {
            log.error("Failed to fetch doctor: {}", e.getMessage());
            throw new RuntimeException("Doctor service unavailable: " + e.getMessage());
        }
    }
}
