package com.micro.ezclinickaveen.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.DecimalFormat;

@Configuration
@Getter
public class PayHereConfig {

    @Value("${payhere.merchant.id}")
    private String merchantId;

    @Value("${payhere.merchant.secret}")
    private String merchantSecret;

    @Value("${payhere.sandbox:true}")
    private boolean sandbox;

    public String generateHash(String orderId, double amount, String currency) {
        try {
            DecimalFormat df = new DecimalFormat("0.00");
            String formattedAmount = df.format(amount);
            
            String hashedSecret = getMd5(merchantSecret).toUpperCase();
            String hashString = merchantId + orderId + formattedAmount + currency + hashedSecret;
            return getMd5(hashString).toUpperCase();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PayHere MD5 Hash", e);
        }
    }

    private String getMd5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(input.getBytes());
            BigInteger no = new BigInteger(1, messageDigest);
            String hashtext = no.toString(16);
            while (hashtext.length() < 32) {
                hashtext = "0" + hashtext;
            }
            return hashtext;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
