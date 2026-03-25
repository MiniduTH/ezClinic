FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/appointment-payment-service-1.0.0.jar app.jar
EXPOSE 3004
ENTRYPOINT ["java", "-jar", "app.jar"]
