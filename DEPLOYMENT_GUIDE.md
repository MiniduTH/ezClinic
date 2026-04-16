# ezClinic Local Development Guide

## System Overview

ezClinic is a microservices-based telemedicine platform with 5 backend services and a Next.js frontend.

### Service Architecture

| Service | Technology | Port | Path | Purpose |
|---------|-----------|------|------|---------|
| **frontend** | Next.js 16 | 3000 | / | Web UI |
| **doctor-service** | NestJS | 3002 | /api/v1 | Doctor profiles, availability, prescriptions |
| **appointment-payment-service** | Spring Boot | 3004 | /api/v1 | Appointments, bookings, PayHere integration |
| **patient-admin-service** | NestJS | 3005 | /api/v1 | Patient profiles, admin, AWS S3 uploads |
| **telemedicine-notification-service** | Spring Boot/Gradle | 8090 | /api/v1 | Video sessions, notifications, Jitsi, Mailtrap |

### Infrastructure Dependencies

- **PostgreSQL** (Supabase) - Patient, appointment data
- **MongoDB** - Doctor data
- **RabbitMQ** - Message queue for service communication
- **Auth0** - Authentication & authorization

---

## Prerequisites

### Required Software
```bash
# Node.js & npm
node --version  # v18+ required
npm --version

# Java
java --version  # Java 17 required

# Maven
mvn --version

# Gradle (included via wrapper)
./gradlew --version
```

### Required Services
- PostgreSQL (or Supabase account)
- MongoDB (local or MongoDB Atlas)
- RabbitMQ (via Docker or local)
- Auth0 account

---

## Quick Start

### 1. Infrastructure Setup

#### Start RabbitMQ & MongoDB (Docker)
```bash
cd /home/runner/work/ezClinic/ezClinic
docker compose up -d rabbitmq mongodb
```

Or manually:
```bash
# RabbitMQ
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.13-management-alpine

# MongoDB
docker run -d --name mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo:7-jammy
```

### 2. Environment Configuration

Create `.env` files in each service directory based on `.env.example`:

#### Root `.env`
```bash
cp .env.example .env
# Edit with your actual credentials
```

#### Frontend `.env.local`
```bash
cd frontend
cp .env.example .env.local
```

Edit with:
```env
AUTH0_DOMAIN=dev-6x78k6ttww4d1cif.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_SECRET=$(openssl rand -hex 32)
AUTH0_AUDIENCE=https://api.ezclinic.com
APP_BASE_URL=http://localhost:3000

NEXT_PUBLIC_PATIENT_API=http://localhost:3005/api/v1
NEXT_PUBLIC_DOCTOR_API=http://localhost:3002/api/v1
NEXT_PUBLIC_APPOINTMENT_API=http://localhost:3004/api/v1
NEXT_PUBLIC_TELEMEDICINE_API=http://localhost:8090/api/v1
```

#### Service `.env` files
```bash
# doctor-service
cd services/doctor-service
cp .env.example .env
# Configure MongoDB, Auth0

# patient-admin-service
cd ../patient-admin-service
cp .env.example .env
# Configure Supabase, AWS S3, Auth0

# appointment-payment-service
cd ../appointment-payment-service
cp .env.example .env
# Configure Supabase, PayHere, RabbitMQ, Auth0

# telemedicine-notification-service
cd ../telemedicine-notification-service
cp .env.example .env
# Configure Supabase, Jitsi, Mailtrap, RabbitMQ, Auth0
```

### 3. Build All Services

```bash
# Frontend
cd frontend
npm install
npm run build

# Doctor Service (NestJS)
cd ../services/doctor-service
npm install
npm run build

# Patient Admin Service (NestJS)
cd ../patient-admin-service
npm install
npm run build

# Appointment Payment Service (Spring Boot/Maven)
cd ../appointment-payment-service
mvn clean install -DskipTests

# Telemedicine Notification Service (Spring Boot/Gradle)
cd ../telemedicine-notification-service
./gradlew clean build -x test
```

### 4. Start Services

Open 6 terminal windows:

#### Terminal 1: Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

#### Terminal 2: Doctor Service
```bash
cd services/doctor-service
npm run dev
# Runs on http://localhost:3002
# Swagger: http://localhost:3002/api/docs
```

#### Terminal 3: Patient Admin Service
```bash
cd services/patient-admin-service
npm run dev
# Runs on http://localhost:3005
# Swagger: http://localhost:3005/api/docs
```

#### Terminal 4: Appointment Payment Service
```bash
cd services/appointment-payment-service
mvn spring-boot:run
# Runs on http://localhost:3004
# Swagger: http://localhost:3004/api/v1/swagger-ui.html
```

#### Terminal 5: Telemedicine Notification Service
```bash
cd services/telemedicine-notification-service
./gradlew bootRun
# Runs on http://localhost:8090
# Swagger: http://localhost:8090/api/v1/swagger-ui.html
```

---

## Verification

### Health Checks

```bash
# Frontend
curl http://localhost:3000

# Doctor Service
curl http://localhost:3002/api/docs

# Patient Admin Service
curl http://localhost:3005/api/docs

# Appointment Payment Service
curl http://localhost:3004/api/v1/swagger-ui.html

# Telemedicine Service
curl http://localhost:8090/api/v1/swagger-ui.html
```

### Database Connections

```bash
# Check MongoDB
mongo mongodb://admin:password@localhost:27017

# Check RabbitMQ Management
open http://localhost:15672
# Default: guest/guest
```

---

## Common Issues & Solutions

### Port Already in Use
```bash
# Find process on port
lsof -ti:3000  # or 3002, 3004, 3005, 8090

# Kill process
kill -9 <PID>
```

### Database Connection Failed
- Verify PostgreSQL/Supabase credentials in `.env`
- Verify MongoDB is running: `docker ps | grep mongo`
- Check connection strings match your setup

### Auth0 Unauthorized
- Verify Auth0 application settings
- Ensure `AUTH0_AUDIENCE` matches API identifier
- Check custom claim `https://ezclinic.com/roles` is set in Auth0 Actions

### RabbitMQ Connection Refused
```bash
# Restart RabbitMQ
docker restart rabbitmq

# Check logs
docker logs rabbitmq
```

### Build Failures

#### NestJS services
```bash
# Clear cache
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

#### Spring Boot services
```bash
# Clear Maven cache
mvn clean
rm -rf target/
mvn install -DskipTests

# For Gradle
./gradlew clean build --refresh-dependencies
```

---

## API Testing

### Using Swagger UI

Each service has interactive API documentation:

- Doctor Service: http://localhost:3002/api/docs
- Patient Admin: http://localhost:3005/api/docs
- Appointments: http://localhost:3004/api/v1/swagger-ui.html
- Telemedicine: http://localhost:8090/api/v1/swagger-ui.html

### Using cURL

```bash
# Get Access Token (replace with your Auth0 credentials)
curl --request POST \
  --url 'https://dev-6x78k6ttww4d1cif.us.auth0.com/oauth/token' \
  --header 'content-type: application/json' \
  --data '{
    "client_id":"YOUR_CLIENT_ID",
    "client_secret":"YOUR_CLIENT_SECRET",
    "audience":"https://api.ezclinic.com",
    "grant_type":"client_credentials"
  }'

# Use token in API requests
export TOKEN="your_access_token"

# List doctors
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3002/api/v1/doctors

# Get patient profile
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3005/api/v1/patients/me

# List appointments
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3004/api/v1/appointments
```

---

## Development Workflow

### Making Changes

1. **Edit Code** in your IDE
2. **Auto-reload** (dev servers watch for changes)
   - NestJS: Automatic via `npm run dev`
   - Spring Boot: Requires restart or DevTools
   - Next.js: Hot Module Replacement (HMR)

3. **Test Endpoint**
   ```bash
   # Use Swagger UI or curl
   curl http://localhost:3002/api/v1/your-endpoint
   ```

4. **Check Logs** in service terminal

### Running Tests

```bash
# Frontend
cd frontend
npm test

# NestJS Services
cd services/doctor-service
npm test

# Spring Boot Services
cd services/appointment-payment-service
mvn test

cd services/telemedicine-notification-service
./gradlew test
```

---

## Production Deployment

### Docker Compose (All Services)

```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all
docker compose down
```

### Individual Docker Builds

```bash
# Frontend
cd frontend
docker build -t ezclinic-frontend .
docker run -p 3000:3000 ezclinic-frontend

# Each service has similar Dockerfile
```

---

## Monitoring

### Logs

```bash
# Frontend (Next.js logs)
tail -f frontend/.next/build.log

# NestJS services
# Logs to console in dev mode

# Spring Boot services
# Check logs/ directory or console output
```

### RabbitMQ Management

- URL: http://localhost:15672
- Credentials: `guest/guest`
- Monitor queues, connections, channels

---

## Auth0 Configuration

### Required Settings

1. **Application Type**: Regular Web Application
2. **Allowed Callback URLs**:
   ```
   http://localhost:3000/api/auth/callback
   ```
3. **Allowed Logout URLs**:
   ```
   http://localhost:3000
   ```
4. **Allowed Web Origins**:
   ```
   http://localhost:3000
   ```

### Custom Claim (Actions)

Create Auth0 Action to add roles:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://ezclinic.com';
  if (event.authorization) {
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  }
};
```

### Roles

- `patient` - Book appointments, view profile
- `doctor` - Manage schedule, prescriptions, telemedicine
- `admin` - Manage users, view reports

---

## Troubleshooting

### Check Service Status

```bash
# All running processes
ps aux | grep -E "node|java|gradle"

# Ports in use
lsof -i :3000
lsof -i :3002
lsof -i :3004
lsof -i :3005
lsof -i :8090
```

### Reset Everything

```bash
# Stop all services
pkill -f node
pkill -f java
pkill -f gradle

# Stop Docker containers
docker compose down -v

# Clear builds
rm -rf frontend/.next
rm -rf services/*/dist
rm -rf services/*/target
rm -rf services/*/build

# Rebuild
# Follow "Build All Services" steps above
```

---

## Support

For issues or questions:
1. Check service logs
2. Verify environment variables
3. Confirm all dependencies are running
4. Review Swagger API documentation

---

## Summary: Critical Configuration

### Frontend API Endpoints (Correct Ports)
```
NEXT_PUBLIC_PATIENT_API=http://localhost:3005/api/v1
NEXT_PUBLIC_DOCTOR_API=http://localhost:3002/api/v1
NEXT_PUBLIC_APPOINTMENT_API=http://localhost:3004/api/v1
NEXT_PUBLIC_TELEMEDICINE_API=http://localhost:8090/api/v1
```

### Service Ports (MUST NOT CONFLICT)
- Frontend: **3000**
- Doctor: **3002**
- Appointments: **3004**
- Patient/Admin: **3005**
- Telemedicine: **8090**

### Infrastructure Ports
- PostgreSQL: **5432**
- MongoDB: **27017**
- RabbitMQ: **5672** (management: 15672)
