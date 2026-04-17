package com.ezclinic.telemedicine;

import com.ezclinic.telemedicine.service.EmailService;
import com.ezclinic.telemedicine.service.GeminiService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@ActiveProfiles("test")
class TelemedicineNotificationServiceApplicationTests {

	@MockitoBean
	private EmailService emailService;

	@MockitoBean
	private GeminiService geminiService;

	@Test
	void contextLoads() {
	}

}
