FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build the application skipping tests for speed
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/ezclinic-kaveen-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 3004
ENTRYPOINT ["java", "-jar", "app.jar"]
