# ezClinic Appointment & Payment Service - Docker Setup

This guide explains how to build and run the Appointment & Payment microservice using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed (comes with Docker Desktop)
- `.env` file configured with your credentials

## Architecture

The service consists of two containers:
1. **RabbitMQ** - Message broker for async notifications (port 5672, management UI on 15672)
2. **Appointment Service** - Spring Boot application (port 3004)

## Quick Start

### 1. Build and Run with Docker Compose

```bash
cd ezclinic-kaveen
docker-compose up --build
```

This will:
- Start RabbitMQ with management UI
- Build the Spring Boot application
- Wait for RabbitMQ to be healthy
- Start the appointment service

### 2. Access the Services

- **Appointment Service API**: http://localhost:3004/api/appointments
- **RabbitMQ Management UI**: http://localhost:15672 (guest/guest)
- **Health Check**: http://localhost:3004/actuator/health (if actuator is enabled)

## Manual Docker Commands

### Build the Docker Image

```bash
docker build -t ezclinic-appointment-service:latest .
```

### Run RabbitMQ Separately

```bash
docker run -d \
  --name ezclinic-rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3.12-management
```

### Run the Appointment Service

```bash
docker run -d \
  --name ezclinic-appointment-service \
  -p 3004:3004 \
  --link ezclinic-rabbitmq:rabbitmq \
  -e SUPABASE_DB_URL=jdbc:postgresql://aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres \
  -e SUPABASE_DB_USER=postgres.khjudbdedrlkvezaihav \
  -e SUPABASE_DB_PASSWORD=Supabase101!@#$%25 \
  -e RABBITMQ_HOST=rabbitmq \
  -e RABBITMQ_PORT=5672 \
  -e PAYHERE_MERCHANT_ID=1230328 \
  -e PAYHERE_MERCHANT_SECRET=MjA2Mjg5Njk0MzYzODI2MTY4OTIzMzExODMxOTIzMTg3MDAyMjMx \
  -e DOCTOR_SERVICE_URL=http://host.docker.internal:3002/api/doctors \
  ezclinic-appointment-service:latest
```

## Environment Variables

The service requires these environment variables (configured in `.env`):

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_DB_URL` | PostgreSQL connection URL | `jdbc:postgresql://...` |
| `SUPABASE_DB_USER` | Database username | `postgres.xxx` |
| `SUPABASE_DB_PASSWORD` | Database password | `YourPassword` |
| `RABBITMQ_HOST` | RabbitMQ hostname | `rabbitmq` (in Docker) |
| `RABBITMQ_PORT` | RabbitMQ port | `5672` |
| `PAYHERE_MERCHANT_ID` | PayHere merchant ID | `1230328` |
| `PAYHERE_MERCHANT_SECRET` | PayHere secret key | `MjA2...` |
| `DOCTOR_SERVICE_URL` | Doctor service endpoint | `http://localhost:3002/api/doctors` |

## Useful Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Appointment service only
docker-compose logs -f appointment-service

# RabbitMQ only
docker-compose logs -f rabbitmq
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes

```bash
docker-compose down -v
```

### Rebuild After Code Changes

```bash
docker-compose up --build
```

### Check Running Containers

```bash
docker ps
```

### Execute Commands Inside Container

```bash
docker exec -it ezclinic-appointment-service sh
```

## Testing the API

### Book an Appointment

```bash
curl -X POST http://localhost:3004/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "123e4567-e89b-12d3-a456-426614174000",
    "doctorId": "123e4567-e89b-12d3-a456-426614174001",
    "slotId": "123e4567-e89b-12d3-a456-426614174002",
    "appointmentDate": "2026-04-15",
    "type": "PHYSICAL"
  }'
```

### Get Appointment

```bash
curl http://localhost:3004/api/appointments/{appointmentId}
```

### Get Payment Checkout Parameters

```bash
curl http://localhost:3004/api/payments/checkout-params/{appointmentId}
```

## Troubleshooting

### Service Won't Start

1. Check if ports 3004, 5672, or 15672 are already in use:
   ```bash
   netstat -ano | findstr :3004
   netstat -ano | findstr :5672
   ```

2. Check Docker logs:
   ```bash
   docker-compose logs appointment-service
   ```

### Database Connection Issues

- Verify Supabase credentials in `.env`
- Check if your IP is whitelisted in Supabase dashboard
- Test connection from host machine first

### RabbitMQ Connection Issues

- Wait for RabbitMQ to be fully started (healthcheck passes)
- Check RabbitMQ logs: `docker-compose logs rabbitmq`
- Access management UI at http://localhost:15672

### Cannot Connect to Doctor Service

- If Doctor Service is running on host machine, use `host.docker.internal` instead of `localhost`
- Update `DOCTOR_SERVICE_URL` to: `http://host.docker.internal:3002/api/doctors`

## Production Considerations

For production deployment:

1. **Use secrets management** instead of `.env` file
2. **Configure proper health checks** in Kubernetes
3. **Set resource limits** (CPU, memory)
4. **Use external RabbitMQ cluster** instead of container
5. **Enable Spring Boot Actuator** for monitoring
6. **Configure proper logging** (JSON format for log aggregation)
7. **Use non-root user** in Dockerfile
8. **Scan images for vulnerabilities**

## Multi-Stage Build Explanation

The Dockerfile uses a multi-stage build:

1. **Build Stage** (`maven:3.9.6-eclipse-temurin-17-alpine`)
   - Copies source code and pom.xml
   - Runs `mvn clean package -DskipTests`
   - Produces the JAR file

2. **Runtime Stage** (`eclipse-temurin:17-jre-alpine`)
   - Uses minimal JRE image (smaller size)
   - Copies only the JAR file from build stage
   - Exposes port 3004
   - Runs the application

This approach:
- Reduces final image size (no Maven, no source code)
- Improves security (fewer attack surfaces)
- Speeds up deployment (smaller images transfer faster)

## Integration with Other Services

This service integrates with:

- **Doctor Service** (port 3002) - For doctor availability checks
- **Notification Service** - Via RabbitMQ events
- **PayHere Payment Gateway** - For payment processing
- **Supabase PostgreSQL** - For data persistence

## Next Steps

1. Deploy to Kubernetes cluster
2. Configure Kong API Gateway routing
3. Set up Prometheus metrics collection
4. Configure Grafana dashboards
5. Implement distributed tracing (Zipkin/Jaeger)
