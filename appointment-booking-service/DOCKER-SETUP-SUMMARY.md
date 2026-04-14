# Docker Setup Summary - ezClinic Appointment Service

## ✅ What's Been Configured

### 1. Dockerfile (Multi-Stage Build)
- **Build Stage**: Uses Maven to compile the Spring Boot application
- **Runtime Stage**: Uses lightweight JRE Alpine image
- **Optimizations**: Skips tests, minimal image size (~200MB)

### 2. Docker Compose Configuration
- **RabbitMQ Service**: Message broker with management UI
- **Appointment Service**: Spring Boot application
- **Health Checks**: Ensures RabbitMQ is ready before starting app
- **Environment Variables**: Loaded from `.env` file

### 3. .dockerignore
- Excludes unnecessary files from build context
- Reduces build time and image size
- Ignores IDE files, logs, and documentation

### 4. Helper Scripts (Windows)
- `build-and-run.bat` - One-click build and start
- `view-logs.bat` - Live log streaming
- `stop-services.bat` - Clean shutdown

### 5. Documentation
- `README-DOCKER.md` - Comprehensive Docker guide
- `QUICKSTART.md` - Quick start instructions
- `DOCKER-SETUP-SUMMARY.md` - This file

## 📦 Docker Images Used

| Image | Purpose | Size |
|-------|---------|------|
| `maven:3.9.6-eclipse-temurin-17-alpine` | Build stage | ~400MB |
| `eclipse-temurin:17-jre-alpine` | Runtime | ~180MB |
| `rabbitmq:3.12-management` | Message broker | ~200MB |

## 🚀 How to Run

### Quick Start (Windows)
```bash
build-and-run.bat
```

### Manual Start
```bash
docker-compose up --build -d
```

## 🔍 Verify Setup

### Check Running Containers
```bash
docker ps
```

Expected output:
```
CONTAINER ID   IMAGE                    STATUS         PORTS
xxxxx          ezclinic-appointment     Up 2 minutes   0.0.0.0:3004->3004/tcp
xxxxx          rabbitmq:3.12-mgmt       Up 2 minutes   0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp
```

### Test API Endpoint
```bash
curl http://localhost:3004/api/appointments/doctors/search
```

### Access RabbitMQ UI
http://localhost:15672 (guest/guest)

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Docker Compose Network          │
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │   RabbitMQ   │◄───│ Appointment  │  │
│  │   :5672      │    │   Service    │  │
│  │   :15672     │    │   :3004      │  │
│  └──────────────┘    └──────────────┘  │
│         │                    │          │
└─────────┼────────────────────┼──────────┘
          │                    │
          ▼                    ▼
    Management UI         REST API
   localhost:15672    localhost:3004
```

## 🔧 Configuration Files

### Environment Variables (.env)
```
SUPABASE_DB_URL=jdbc:postgresql://...
SUPABASE_DB_USER=postgres.xxx
SUPABASE_DB_PASSWORD=xxx
PAYHERE_MERCHANT_ID=xxx
PAYHERE_MERCHANT_SECRET=xxx
DOCTOR_SERVICE_URL=http://localhost:3002/api/doctors
```

### Exposed Ports
- `3004` - Appointment Service REST API
- `5672` - RabbitMQ AMQP
- `15672` - RabbitMQ Management UI

## 📊 Resource Usage

Typical resource consumption:
- **CPU**: ~0.5-1 core per service
- **Memory**: ~512MB for Spring Boot, ~256MB for RabbitMQ
- **Disk**: ~600MB total (images + containers)

## 🔐 Security Considerations

### Current Setup (Development)
- ⚠️ Using default RabbitMQ credentials (guest/guest)
- ⚠️ Database credentials in `.env` file
- ⚠️ No SSL/TLS encryption
- ⚠️ Running as root user in container

### Production Recommendations
1. Use Docker secrets for sensitive data
2. Enable SSL/TLS for all connections
3. Run as non-root user
4. Use private Docker registry
5. Implement network policies
6. Enable container scanning
7. Use read-only file systems where possible

## 🧪 Testing the Setup

### 1. Health Check
```bash
docker-compose ps
```

### 2. View Logs
```bash
docker-compose logs -f appointment-service
```

### 3. Test Appointment Booking
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

### 4. Check RabbitMQ Queue
- Open http://localhost:15672
- Navigate to "Queues" tab
- Look for `payment.success.queue`

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs appointment-service

# Restart services
docker-compose restart

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

### Database Connection Failed
- Verify Supabase credentials in `.env`
- Check if IP is whitelisted in Supabase
- Test connection from host machine first

### RabbitMQ Connection Refused
- Wait 30 seconds for RabbitMQ to fully initialize
- Check health status: `docker-compose ps`
- Verify port 5672 is not blocked by firewall

## 📈 Next Steps

### 1. Kubernetes Deployment
- Create Kubernetes manifests (Deployment, Service, ConfigMap, Secret)
- Set up Helm charts for easier deployment
- Configure horizontal pod autoscaling

### 2. CI/CD Pipeline
- GitHub Actions workflow for automated builds
- Push images to Docker Hub or private registry
- Automated testing before deployment

### 3. Monitoring & Observability
- Add Prometheus metrics endpoint
- Configure Grafana dashboards
- Implement distributed tracing (Jaeger/Zipkin)
- Set up log aggregation (ELK stack)

### 4. Integration with Other Services
- Connect to Doctor Service (port 3002)
- Connect to Patient Service (port 3001)
- Connect to Notification Service (port 3005)
- Set up Kong API Gateway

## 📝 Maintenance Commands

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up --build -d
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove unused images
docker image prune -a
```

### Backup Database
```bash
# Export from Supabase dashboard
# Or use pg_dump if direct access is available
```

## 🎯 Success Criteria

Your Docker setup is successful if:
- ✅ Both containers start without errors
- ✅ API responds at http://localhost:3004
- ✅ RabbitMQ UI accessible at http://localhost:15672
- ✅ Can book appointments via API
- ✅ Payment events published to RabbitMQ
- ✅ Logs show no connection errors

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Spring Boot Docker Guide](https://spring.io/guides/gs/spring-boot-docker/)
- [RabbitMQ Docker Guide](https://www.rabbitmq.com/download.html)

---

**Created**: April 6, 2026  
**Service**: Appointment & Payment Microservice  
**Owner**: Kaveen (Security Lead)  
**Version**: 1.0.0
