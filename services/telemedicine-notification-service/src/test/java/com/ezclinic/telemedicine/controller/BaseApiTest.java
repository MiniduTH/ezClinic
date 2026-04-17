package com.ezclinic.telemedicine.controller;

import com.ezclinic.telemedicine.service.EmailService;
import com.ezclinic.telemedicine.service.GeminiService;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseApiTest {

    @Autowired
    protected MockMvc mockMvc;

    @MockitoBean
    protected EmailService emailService;

    @MockitoBean
    protected GeminiService geminiService;

    @BeforeEach
    void setUpDefaultMocks() {
        // Default stub so GeminiService returns valid JSON instead of null
        Mockito.lenient().when(geminiService.analyzeSymptoms(Mockito.anyString()))
                .thenReturn("{\"recommendation\":\"Please consult a doctor.\",\"disclaimer\":\"AI only.\"}");
    }
}
