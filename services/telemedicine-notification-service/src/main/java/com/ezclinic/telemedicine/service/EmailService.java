package com.ezclinic.telemedicine.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import io.mailtrap.client.MailtrapClient;
import io.mailtrap.config.MailtrapConfig;
import io.mailtrap.factory.MailtrapClientFactory;
import io.mailtrap.model.request.emails.Address;
import io.mailtrap.model.request.emails.MailtrapMail;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    @Value("${mailtrap.api-key}")
    private String API_KEY;
    @Value("${mailtrap.sender}")
    private String SENDER_EMAIL;

    public void sendEmailViaAPI(String recipientEmail, String subject, String content){

        final MailtrapConfig config = new MailtrapConfig.Builder()
                .token(API_KEY)
                .build();

        final MailtrapClient client = MailtrapClientFactory.createMailtrapClient(config);

        final MailtrapMail mail = MailtrapMail.builder()
                .from(new Address(SENDER_EMAIL, "Notification From ezClinic :)"))
                .to(List.of(new Address(recipientEmail)))
                .subject(subject)
                .text(content)
                .category("Integration Test")
                .build();

        try {

            client.send(mail);

            System.out.println("Email Sent Successfully via API...");
        } catch (Exception e) {
            System.out.println("Caught exception : " + e);
        }

    }
}
