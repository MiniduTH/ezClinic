package com.ezclinic.telemedicine.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.List;

@Service
@Slf4j
public class GeminiService {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    public String analyzeSymptoms(String symptoms) {
        if (apiKey == null || apiKey.isEmpty() || "your_gemini_api_key".equals(apiKey)) {
            log.warn("Gemini API key is not configured. Returning fallback suggestion.");
            return "{\"disclaimer\":\"API Key not configured. Please consult a doctor for accurate advice.\",\"recommendation\":\"Monitor your symptoms.\"}";
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        String prompt = "You are an AI Symptom Checker for ezClinic. Provide a preliminary health suggestion based on these symptoms: '" + symptoms + "'. " +
                "Format your response as a valid JSON object with two fields: 'recommendation' (concise advice) and 'disclaimer' (always advise consulting a doctor).";

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // Extract text from Gemini response structure
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        String text = (String) parts.get(0).get("text");
                        // Strip markdown formatting if any
                        text = text.replaceAll("```json", "").replaceAll("```", "").trim();
                        return text;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to call Gemini API", e);
        }

        return "{\"error\":\"Failed to analyze symptoms.\"}";
    }
}
