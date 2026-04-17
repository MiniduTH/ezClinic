# ─── Build stage ─────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Cache Maven dependencies before copying source — rebuilds only when pom.xml changes
COPY pom.xml ./
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn clean package -DskipTests -q

# ─── Production stage ─────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /app/target/ezclinic-kaveen-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3004/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
