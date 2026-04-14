# Deployment Checklist - ezClinic Appointment Service

## Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Docker Desktop installed and running
- [ ] `.env` file created with all required variables
- [ ] Supabase database accessible
- [ ] Ports 3004, 5672, 15672 available
- [ ] Git repository up to date

### ✅ Configuration Files
- [x] `Dockerfile` - Multi-stage build configured
- [x] `docker-compose.yml` - Services defined
- [x] `.dockerignore` - Build optimization
- [x] `.env` - Environment variables
- [x] `application.properties` - Spring Boot config

### ✅ Code Quality
- [ ] All Java files compile without errors
- [ ] No critical security vulnerabilities
- [ ] Lombok annotations working
- [ ] Database migrations ready (if any)
- [ ] API endpoints tested locally

## Deployment Steps

### Step 1: Pre-Flight Checks
```bash
# Verify Docker is running
docker --version
docker ps

# Check if ports are free
netstat -ano | findstr :3004
netstat -ano | findstr :5672
netstat -ano | findstr :15672
```

### Step 2: Build Docker Image
```bash
cd ezclinic-kaveen
docker-compose build
```

**Expected Output:**
```
Building appointment-service
[+] Building 120.5s (12/12) FINISHED
 => [build 1/4] FROM maven:3.9.6-eclipse-temurin-17-alpine
 => [build 2/4] COPY pom.xml .
 => [build 3/4] COPY src ./src
 => [build 4/4] RUN mvn clean package -DskipTests
 => [runtime 1/2] FROM eclipse-temurin:17-jre-alpine
 => [runtime 2/2] COPY --from=build /app/target/*.jar app.jar
Successfully built xxxxx
```

### Step 3: Start Services
```bash
docker-compose up -d
```

**Expected Output:**
```
Creating ezclinic-rabbitmq ... done
Creating ezclinic-appointment-service ... done
```

### Step 4: Verify Services
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f
```

**Expected Status:**
```
NAME                          STATUS         PORTS
ezclinic-rabbitmq             Up (healthy)   5672/tcp, 15672/tcp
ezclinic-appointment-service  Up             3004/tcp
```

### Step 5: Test Endpoints
```bash
# Test doctor search
curl http://localhost:3004/api/appointments/doctors/search

# Test health (if actuator enabled)
curl http://localhost:3004/actuator/health
```

### Step 6: Verify RabbitMQ
- Open http://localhost:15672
- Login: guest/guest
- Check "Queues" tab for `payment.success.queue`

## Post-Deployment Verification

### ✅ Functional Tests
- [ ] Can search for doctors
- [ ] Can book an appointment
- [ ] Payment record created
- [ ] Can retrieve appointment by ID
- [ ] Can cancel appointment
- [ ] Can reschedule appointment
- [ ] PayHere checkout params generated
- [ ] Webhook processing works

### ✅ Integration Tests
- [ ] Database connection working
- [ ] RabbitMQ connection established
- [ ] Messages published to queue
- [ ] Doctor Service communication (if available)
- [ ] PayHere webhook signature verification

### ✅ Performance Tests
- [ ] Response time < 500ms for GET requests
- [ ] Response time < 1s for POST requests
- [ ] No memory leaks after 100 requests
- [ ] Container CPU usage < 50%
- [ ] Container memory usage < 512MB

### ✅ Security Tests
- [ ] No sensitive data in logs
- [ ] Environment variables loaded correctly
- [ ] Database credentials not exposed
- [ ] PayHere secret not exposed
- [ ] CORS configured properly (if needed)

## Rollback Plan

If deployment fails:

### Option 1: Quick Rollback
```bash
# Stop current containers
docker-compose down

# Revert to previous version
git checkout <previous-commit>

# Rebuild and restart
docker-compose up --build -d
```

### Option 2: Manual Rollback
```bash
# Stop services
docker-compose down

# Remove images
docker rmi ezclinic-kaveen-appointment-service

# Pull previous image (if using registry)
docker pull <registry>/ezclinic-appointment:previous-tag

# Start with previous image
docker-compose up -d
```

## Monitoring Setup

### Logs
```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f appointment-service
```

### Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df
```

### Health Checks
```bash
# Container health
docker inspect ezclinic-appointment-service | grep -A 10 Health

# Application health (if actuator enabled)
curl http://localhost:3004/actuator/health
```

## Common Issues & Solutions

### Issue: Container Exits Immediately
**Solution:**
```bash
# Check logs for errors
docker-compose logs appointment-service

# Common causes:
# - Database connection failed
# - Port already in use
# - Missing environment variables
```

### Issue: Cannot Connect to Database
**Solution:**
1. Verify `.env` credentials
2. Check Supabase IP whitelist
3. Test connection from host:
   ```bash
   psql -h aws-1-ap-northeast-2.pooler.supabase.com -U postgres.xxx -d postgres
   ```

### Issue: RabbitMQ Connection Refused
**Solution:**
```bash
# Wait for RabbitMQ to be ready
docker-compose logs rabbitmq

# Check health
docker inspect ezclinic-rabbitmq | grep Health

# Restart if needed
docker-compose restart rabbitmq
```

### Issue: Port Already in Use
**Solution:**
```bash
# Find process using port
netstat -ano | findstr :3004

# Kill process (Windows)
taskkill /PID <pid> /F

# Or change port in docker-compose.yml
```

## Production Deployment Additions

### Before Production
- [ ] Enable HTTPS/TLS
- [ ] Configure proper secrets management
- [ ] Set up log aggregation
- [ ] Configure monitoring alerts
- [ ] Implement rate limiting
- [ ] Set up backup strategy
- [ ] Configure auto-scaling
- [ ] Implement circuit breakers
- [ ] Set up disaster recovery
- [ ] Document runbooks

### Kubernetes Deployment
- [ ] Create Deployment manifest
- [ ] Create Service manifest
- [ ] Create ConfigMap for config
- [ ] Create Secret for credentials
- [ ] Set up Ingress rules
- [ ] Configure HPA (Horizontal Pod Autoscaler)
- [ ] Set resource limits/requests
- [ ] Configure liveness/readiness probes
- [ ] Set up PersistentVolumeClaims (if needed)

### CI/CD Pipeline
- [ ] GitHub Actions workflow
- [ ] Automated testing
- [ ] Docker image scanning
- [ ] Automated deployment to staging
- [ ] Manual approval for production
- [ ] Rollback automation

## Success Metrics

### Deployment Success
- ✅ All containers running
- ✅ All health checks passing
- ✅ API responding correctly
- ✅ No errors in logs
- ✅ Database connected
- ✅ RabbitMQ connected

### Performance Metrics
- Response time: < 500ms (p95)
- Uptime: > 99.9%
- Error rate: < 0.1%
- CPU usage: < 50%
- Memory usage: < 512MB

## Contact & Support

**Service Owner:** Kaveen (Security Lead)  
**Module:** Appointment & Payment Service  
**Port:** 3004  
**Dependencies:** RabbitMQ, Supabase PostgreSQL, Doctor Service  

---

**Last Updated:** April 6, 2026  
**Version:** 1.0.0  
**Status:** ✅ Ready for Deployment
