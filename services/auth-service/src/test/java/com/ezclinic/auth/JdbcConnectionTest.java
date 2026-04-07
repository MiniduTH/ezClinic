package com.ezclinic.auth;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Properties;
import java.io.FileInputStream;
import java.io.File;

public class JdbcConnectionTest {

    public static void main(String[] args) {
        String envPath = "services/auth-service/.env";
        if (!new File(envPath).exists()) {
             envPath = ".env"; // if running from within the service directory
        }

        Properties props = new Properties();
        try (FileInputStream fis = new FileInputStream(envPath)) {
            props.load(fis);
            
            String host = props.getProperty("DB_HOST");
            String port = props.getProperty("DB_PORT");
            String name = props.getProperty("DB_NAME");
            String user = props.getProperty("DB_USER");
            String pass = props.getProperty("DB_PASSWORD");
            
            // Handle the placeholder case
            if ("[YOUR-PASSWORD]".equals(pass)) {
                System.err.println("ERROR: Please replace [YOUR-PASSWORD] in .env before running this test.");
                return;
            }

            String url = "jdbc:postgresql://" + host + ":" + port + "/" + name;
            
            System.out.println("Connecting to: " + url);
            System.out.println("User: " + user);

            try (Connection conn = DriverManager.getConnection(url, user, pass)) {
                System.out.println("SUCCESS: Connected to Supabase!");
                
                try (Statement stmt = conn.createStatement();
                     ResultSet rs = stmt.executeQuery("SELECT version()")) {
                    if (rs.next()) {
                        System.out.println("Database Version: " + rs.getString(1));
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("CONNECTION FAILED!");
            e.printStackTrace();
        }
    }
}
