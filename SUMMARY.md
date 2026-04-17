# ezClinic — Codebase Map

> **Purpose:** Navigation reference for integrating new features. Read this before touching any service.

---

## 1. What This App Does

**ezClinic** is a microservices-based telemedicine platform. Patients book appointments with doctors, conduct video consultations (Jitsi), pay via PayHere, and manage medical records. An AI symptom checker (Gemini) and email notifications (Mailtrap) are also included.

---

## 2. Architecture Overview

```
[Browser: Next.js 16]
       |
  /api/* routes (server-side auth, token handling)
       |
  ┌────┴──────────────────────────────────────────┐
  │              HTTP REST (apiFetch)              │
  ▼                   ▼                    ▼       ▼
doctor-service  patient-admin-service  appointment-payment-service  telemedicine-notification-service
(NestJS+Mongo)  (NestJS+PostgreSQL)    (Spring Boot+PostgreSQL)     (Spring Boot+PostgreSQL)
   :3002             :3005                    :3004                         :8090
                                                  |
                                           RabbitMQ events
                                       (appointment.#, payment.#)
                                                  |
                                     telemedicine-notification-service
                                         (listens + sends emails)
```

**Databases:**
- PostgreSQL (Supabase): patients, admins, appointments, payments, sessions, notifications
- MongoDB (Atlas): doctors, availabilities, prescriptions
- RabbitMQ: async event bus

---

## 3. Directory Structure

```
ezClinic/
├── docker-compose.yml              # Orchestrates all services
├── DEPLOYMENT_GUIDE.md             # Setup instructions
├── .env.example                    # Root env template
├── frontend/                       # Next.js 16 app (port 3000)
│   └── src/
│       ├── app/                    # App Router pages + API routes
│       ├── components/             # Navbar, Sidebar, NotificationBanner
│       └── lib/                    # auth.ts, api.ts, roles.ts, session-context.tsx
└── services/
    ├── doctor-service/             # NestJS + MongoDB (port 3002)
    ├── patient-admin-service/      # NestJS + PostgreSQL (port 3005)
    ├── appointment-payment-service/# Spring Boot Maven + PostgreSQL (port 3004)
    └── telemedicine-notification-service/ # Spring Boot Gradle + PostgreSQL (port 8090)
```

---

## 4. Services

### 4.1 doctor-service — `services/doctor-service/` (Port 3002)

**Stack:** NestJS, TypeScript, MongoDB (Mongoose)  
**Owns:** Doctor profiles, availability slots, prescriptions

**Module layout:**
```
src/
├── doctor/
│   ├── doctor.controller.ts        # All doctor REST routes
│   ├── doctor.service.ts           # Business logic
│   ├── schemas/
│   │   ├── doctor.schema.ts        # Doctor Mongoose schema
│   │   ├── availability.schema.ts  # Availability slots
│   │   └── prescription.schema.ts  # Prescriptions
│   └── dto/
│       ├── create-doctor.dto.ts
│       └── update-doctor.dto.ts
├── auth/
│   ├── auth.controller.ts          # /auth/register, /auth/login
│   └── auth.service.ts             # JWT generation, bcrypt
└── integration/
    ├── appointment-integration.service.ts  # HTTP → appointment-payment-service
    └── patient-integration.service.ts      # HTTP → patient-admin-service
```

**API prefix:** `/api/v1/doctors`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register doctor |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/` | No | List verified doctors (filterable by specialization) |
| GET | `/me` | JWT | Authenticated doctor profile |
| GET | `/:id` | No | Single doctor |
| PUT | `/:id` | JWT | Full update |
| POST | `/:doctorId/availability` | JWT | Add availability slot |
| POST | `/:doctorId/availability/bulk` | JWT | Bulk add slots |
| GET | `/:doctorId/availability` | No | All availability |
| GET | `/:doctorId/availability/:day` | No | Availability for a day |
| PUT | `/:doctorId/availability/:slotId` | JWT | Update slot |
| PATCH | `/:doctorId/availability/:slotId/toggle` | JWT | Toggle active |
| DELETE | `/:doctorId/availability/:slotId` | JWT | Delete slot |
| DELETE | `/:doctorId/availability/day/:day` | JWT | Clear day's slots |
| GET | `/:id/appointments` | JWT | Doctor's appointments (proxied) |
| PATCH | `/appointments/:appointmentId/status` | JWT | Update appointment status |
| GET | `/patients/:patientId` | JWT | Patient detail (proxied) |
| GET | `/patients/:patientId/reports` | JWT | Patient reports (proxied) |
| POST | `/me/credentials` | JWT | Upload credential docs for verification (max 5, PDF/JPEG/PNG, 5 MB each) |
| PATCH | `/:id/verify` | JWT(Admin) | Approve or reject doctor verification |

**Schemas:**
```
Doctor { _id: string(Auth0 sub), name, email(unique), specialization?, qualification?, bio?, consultationFee, isVerified, credentialDocuments: string[], passwordHash }
Availability { _id: ObjectId, doctorId, dayOfWeek, startTime(HH:mm), endTime(HH:mm), isActive, maxPatients?, consultationType? }
Prescription { _id: ObjectId, doctorId, patientId, medications[], dosage, duration, notes? }
```

**Auth:** Email/password → bcrypt → JWT (role: `'doctor'`, claim: `https://ezclinic.com/roles: ['doctor']`)

---

### 4.2 patient-admin-service — `services/patient-admin-service/` (Port 3005)

**Stack:** NestJS, TypeScript, PostgreSQL (TypeORM)  
**Owns:** Patient profiles, medical reports, admin accounts

**Module layout:**
```
src/
├── patient/
│   ├── patient.controller.ts
│   ├── patient.service.ts
│   ├── entities/
│   │   ├── patient.entity.ts       # TypeORM entity
│   │   └── medical-report.entity.ts
│   └── dto/
│       ├── create-patient.dto.ts
│       ├── update-patient.dto.ts
│       └── upload-report.dto.ts
├── admin/
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   └── entities/admin.entity.ts
└── auth/
    ├── auth.controller.ts           # /auth/register, /auth/login, /auth/admin/login
    └── auth.service.ts
```

**API prefix:** `/api/v1`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Patient register |
| POST | `/auth/login` | No | Patient login |
| POST | `/auth/admin/login` | No | Admin login |
| GET | `/patients` | JWT | List all patients |
| GET | `/patients/me` | JWT | Own profile |
| PUT | `/patients/me` | JWT | Full update own profile |
| PATCH | `/patients/me` | JWT | Partial update |
| POST | `/patients/me/avatar` | JWT | Upload avatar (2MB, JPEG/PNG) |
| GET | `/patients/:id` | JWT | Patient by ID |
| PATCH | `/patients/:id` | JWT | Partial update |
| PUT | `/patients/:id` | JWT | Full update |
| DELETE | `/patients/:id` | JWT | Delete patient |
| POST | `/patients/me/reports` | JWT | Upload medical report (10MB) |
| GET | `/patients/me/reports` | JWT | Own reports (paginated) |
| POST | `/patients/:id/reports` | JWT | Upload report for patient |
| GET | `/patients/:id/reports` | JWT | Patient reports (paginated) |
| GET | `/patients/:id/reports/:reportId` | JWT | Single report |
| DELETE | `/patients/:id/reports/:reportId` | JWT | Soft-delete report |

**Entities:**
```
Patient { id: UUID, name, email(unique), phone?, dob?, gender?, address?, avatarUrl?, bloodType?, allergies?, emergencyContact?, status(active|inactive|suspended), passwordHash }
MedicalReport { id: UUID, patientId(FK), title, reportType(lab|imaging|prescription|other), description?, reportDate?, fileUrl(S3), deletedAt?(soft-delete) }
Admin { id: UUID, name, email(unique), auth0Id?, passwordHash? }
```

**Auth:** Same pattern as doctor-service. AWS S3 for file uploads.

---

### 4.3 appointment-payment-service — `services/appointment-payment-service/` (Port 3004)

**Stack:** Spring Boot, Maven, PostgreSQL (Spring Data JPA)  
**Owns:** Appointments, payments, PayHere integration, RabbitMQ event publishing

**Package layout:**
```
src/main/java/com/ezclinic/appointment/
├── controller/
│   ├── AppointmentController.java
│   ├── PaymentController.java
│   └── HealthController.java
├── service/
│   ├── AppointmentService.java
│   └── PaymentService.java
├── model/
│   ├── Appointment.java            # JPA entity
│   └── Payment.java               # JPA entity
├── repository/
│   ├── AppointmentRepository.java
│   └── PaymentRepository.java
├── dto/                            # Request/response DTOs
├── event/
│   └── EventPublisher.java         # RabbitMQ publisher
├── client/
│   └── DoctorServiceClient.java    # HTTP → doctor-service
└── config/
    ├── RabbitMQConfig.java
    └── SecurityConfig.java
```

**API prefix:** `/api/v1`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/appointments/doctors` | JWT | Search doctors by specialization (proxied) |
| GET | `/appointments/doctors/:id/availability` | JWT | Doctor availability (proxied) |
| POST | `/appointments` | JWT | Book appointment |
| GET | `/appointments` | JWT | Patient's appointments (paginated) |
| GET | `/appointments/my` | JWT | Alias for above |
| GET | `/appointments/doctor` | JWT | Doctor's appointments |
| GET | `/appointments/:id` | JWT | Single appointment |
| PUT | `/appointments/:id` | JWT | Update appointment |
| PATCH | `/appointments/:id/cancel` | JWT | Cancel appointment |
| PATCH | `/appointments/:id/reschedule` | JWT | Reschedule |
| POST | `/payments/:appointmentId/hash` | JWT | Generate PayHere hash |
| POST | `/payments/notify` | Public | PayHere webhook (MD5 verified) |

**Enums:**
```
AppointmentStatus: PENDING, CONFIRMED, COMPLETED, CANCELLED, RESCHEDULED
AppointmentType: IN_PERSON, TELEMEDICINE
PaymentStatus: PENDING, PAID, FAILED, REFUNDED
```

**Models:**
```
Appointment { id: UUID, patientId: String, doctorId, slotId: String, appointmentDate, startTime, endTime, status, type, notes, payment(1:1) }
Payment { id: UUID, appointmentId(FK), amount, status, gatewayReferenceId }
```
> Note: `patientId` and `slotId` are `String` (not UUID) to accommodate MongoDB ObjectId / Auth0 sub values.

**RabbitMQ events published:**
- `appointment.booked`
- `appointment.cancelled`
- `appointment.status.updated`
- `payment.completed` (payload includes `doctorId`)

**Auth:** `TokenAuthFilter` extracts JWT `sub` → `@RequestAttribute("tokenSub")`

---

### 4.4 telemedicine-notification-service — `services/telemedicine-notification-service/` (Port 8090)

**Stack:** Spring Boot, Gradle, PostgreSQL  
**Owns:** Video sessions (Jitsi), email notifications, AI symptom checking (Gemini), RabbitMQ listeners

**Package layout:**
```
src/main/java/com/ezclinic/telemedicine/
├── controller/
│   ├── SessionController.java
│   ├── NotificationController.java
│   └── SymptomCheckController.java
├── service/
│   ├── SessionService.java          # Jitsi JWT + session CRUD
│   ├── NotificationService.java
│   ├── SymptomCheckService.java     # Gemini API calls
│   └── EmailService.java            # Mailtrap SMTP
├── model/
│   ├── Session.java
│   ├── Notification.java
│   └── SymptomCheck.java
├── repository/
├── dto/
├── listener/
│   ├── AppointmentEventListener.java  # Handles appointment.# events
│   └── NotificationListener.java
└── config/
    └── RabbitMQConfig.java
```

**API prefix:** `/api/v1`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sessions` | JWT | Create Jitsi session |
| GET | `/sessions/:id` | JWT | Get session |
| GET | `/sessions/appointment/:appointmentId` | JWT | Session by appointment |
| PATCH | `/sessions/:id/end` | JWT | End session |
| POST | `/notifications/send` | JWT | Send email notification |
| GET | `/notifications/user/:userId` | JWT | User notification history |
| GET | `/notifications/:id` | JWT | Single notification |
| POST | `/symptoms/check` | JWT | AI symptom check |

**Models:**
```
Session { id: UUID, appointmentId, roomId(ezclinic-{appointmentId}), token(JitsiJWT), createdAt, endedAt? }
Notification { id: UUID, userId, type(APPOINTMENT_BOOKED|...), recipientEmail, subject, body, status(SENT|FAILED|PENDING) }
SymptomCheck { id: UUID, userId, symptoms, response(GeminiAI) }
```

**RabbitMQ events consumed:** `appointment.#`, `payment.#`

> On `appointment.booked`, `AppointmentEventListener` auto-creates a Jitsi session and `NotificationService` sends session join links to both patient and doctor.

---

## 5. Frontend — `frontend/` (Port 3000)

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4

### Pages

| Route | Role | Description |
|-------|------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Patient/doctor login |
| `/admin-login` | Public | Admin login |
| `/register` | Public | Patient/doctor registration |
| `/dashboard/patient` | Patient | Patient dashboard |
| `/dashboard/doctor` | Doctor | Doctor dashboard |
| `/dashboard/admin` | Admin | Admin dashboard |
| `/doctors` | Patient | Browse/search doctors |
| `/appointments` | Patient/Doctor | View appointments |
| `/availability` | Doctor | Manage availability slots |
| `/prescriptions` | Patient/Doctor | Prescriptions |
| `/reports` | Patient | Medical reports |
| `/profile` | All | Edit profile |
| `/patients/[id]` | Doctor | Patient detail view |
| `/symptom-checker` | Patient | AI symptom checker |
| `/telemedicine` | All | List video sessions |
| `/telemedicine/[sessionId]` | All | Jitsi video room |
| `/admin/patients` | Admin | Patient management |
| `/admin/doctors` | Admin | Doctor management (with credential preview) |
| `/doctor/verify` | Doctor | Submit credential documents for admin verification |

### API Routes (server-side)

| Route | Description |
|-------|-------------|
| `POST /api/auth/login` | Routes login to correct backend service |
| `POST /api/auth/register` | Routes registration |
| `GET /api/auth/logout` | Clears session cookie |
| `GET /api/auth/session` | Returns current session |
| `GET /api/auth/token` | Returns raw JWT token |
| `GET /api/notifications/status/[appointmentId]` | Notification status |
| `POST /api/symptom-check` | Proxies to telemedicine service |
| `GET /api/telemedicine/[sessionId]` | Session proxy |
| `GET /api/admin/credential` | Proxy credential document from doctor-service for admin preview |

### Key Lib Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | `getSession()`, `setSessionCookie()`, `clearSessionCookie()`, `getTokenFromCookie()` |
| `lib/api.ts` | `apiFetch(url, options)` — wraps fetch with Bearer JWT |
| `lib/roles.ts` | `getRoles()`, `getUserRole()` — role extraction from JWT |
| `lib/session-context.tsx` | `SessionProvider`, `useSession()` React context |
| `lib/theme-context.tsx` | `ThemeProvider`, `useTheme()` — light/dark theme toggle context |

**Key Components:**

| File | Purpose |
|------|---------|
| `components/Navbar.tsx` | Top navigation bar |
| `components/Sidebar.tsx` | Role-gated sidebar navigation (mobile-responsive) |
| `components/AppShell.tsx` | App shell layout wrapper |
| `components/FilePreviewModal.tsx` | Modal for previewing credential documents (PDF/image) |

### Authentication Flow

```
1. POST /api/auth/login → routes to patient-admin-service or doctor-service
2. Backend returns JWT
3. Next.js API route calls setSessionCookie() → httpOnly cookie 'ezclinic_session' (7 days)
4. All subsequent apiFetch() calls attach Bearer <token>
5. getSession() decodes cookie via jose.jwtVerify
```

### Session/Token Structure

```typescript
Session {
  tokenSet: { accessToken: string }  // raw JWT
  user: {
    sub: string           // user ID
    email: string
    name: string
    role: string          // "patient" | "doctor" | "admin"
    "https://ezclinic.com/roles": string[]
  }
}
```

### Environment Variables (Frontend)

```env
NEXT_PUBLIC_PATIENT_API=http://localhost:3005/api/v1
NEXT_PUBLIC_DOCTOR_API=http://localhost:3002/api/v1
NEXT_PUBLIC_APPOINTMENT_API=http://localhost:3004/api/v1
NEXT_PUBLIC_TELEMEDICINE_API=http://localhost:8090/api/v1
```

---

## 6. JWT Token Structure (All Services)

```json
{
  "sub": "uuid-or-auth0-sub",
  "email": "user@example.com",
  "name": "Full Name",
  "role": "patient | doctor | admin",
  "https://ezclinic.com/roles": ["patient | doctor | admin"],
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## 7. Response Envelope Conventions

**NestJS services:**
```typescript
{ success: boolean, data?: T, message?: string, pagination?: { page, limit, totalItems, totalPages } }
```

**Spring Boot services:**
```java
{ "success": boolean, "message": string, "data": T }
```

---

## 8. Cross-Service Communication

| Caller | Callee | Method | What |
|--------|--------|--------|------|
| doctor-service | appointment-payment-service | HTTP GET | Fetch doctor's appointments |
| doctor-service | patient-admin-service | HTTP GET | Fetch patient details/reports |
| appointment-payment-service | doctor-service | HTTP GET | Search doctors, fetch availability |
| appointment-payment-service | RabbitMQ | Publish | appointment.* / payment.* events |
| telemedicine-notification-service | RabbitMQ | Consume | appointment.* / payment.* events |

**RabbitMQ:**
- Exchange: `ezclinic.events` (Topic)
- Queues: `appointment.events.queue`, `payment.events.queue`
- Routing keys: `appointment.booked`, `appointment.cancelled`, `appointment.status.updated`, `payment.completed`

---

## 9. Database Schema

### PostgreSQL (Supabase) — used by 3 services

| Table | Service | Key Columns |
|-------|---------|-------------|
| `patients` | patient-admin | id(UUID PK), name, email, phone, dob, gender, avatarUrl, bloodType, status |
| `admins` | patient-admin | id(UUID PK), name, email, auth0Id?, passwordHash? |
| `appointments` | appointment-payment | id(UUID PK), patientId, doctorId, slotId, appointmentDate, startTime, endTime, status, type |
| `payments` | appointment-payment | id(UUID PK), appointmentId(FK→appointments), amount, status, gatewayReferenceId |
| `sessions` | telemedicine | id(UUID PK), appointmentId, roomId, token, createdAt, endedAt? |
| `notifications` | telemedicine | id(UUID PK), userId, type, recipientEmail, subject, body, status |
| `symptom_checks` | telemedicine | id(UUID PK), userId, symptoms, response |
| `medical_reports` | patient-admin | id(UUID PK), patientId(FK→patients), title, reportType, fileUrl(S3), deletedAt?(soft) |

### MongoDB (Atlas) — doctor-service only

| Collection | Key Fields |
|-----------|-----------|
| `doctors` | _id(Auth0 sub), name, email, specialization, isVerified, passwordHash |
| `availabilities` | _id(ObjectId), doctorId, dayOfWeek, startTime, endTime, isActive |
| `prescriptions` | _id(ObjectId), doctorId, patientId, medications[], dosage, duration |

---

## 10. Third-Party Integrations

| Service | Used By | Purpose | Config Keys |
|---------|---------|---------|-------------|
| PayHere | appointment-payment-service | Payments (Sri Lanka) | `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET` |
| Jitsi Meet | telemedicine-notification-service | Video calls | `JITSI_DOMAIN`, `JITSI_APP_ID`, `JITSI_APP_SECRET` |
| Mailtrap | telemedicine-notification-service | Email (dev/prod) | `MAILTRAP_API_KEY`, `MAILTRAP_SENDER` |
| Google Gemini AI | telemedicine-notification-service | Symptom checker | `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-2.5-flash` |
| AWS S3 | patient-admin-service | File uploads | `AWS_*` env vars |
| Supabase | 3 services | PostgreSQL hosting | `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD` |
| MongoDB Atlas | doctor-service | NoSQL hosting | `MONGO_URI` |
| RabbitMQ | appointment + telemedicine | Event bus | `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USER`, `RABBITMQ_PASS` |

---

## 11. Key Patterns & Conventions

### Naming
- TypeScript files: `kebab-case` (e.g., `doctor.service.ts`)
- Java files: `PascalCase` (e.g., `DoctorService.java`)
- API routes: `/api/v1/{resource}`
- DTOs: `{Action}{Entity}Dto` (e.g., `CreateDoctorDto`, `UpdatePatientDto`)
- Database columns: `snake_case` (PostgreSQL), inferred from schema (MongoDB)

### NestJS Module Structure (pattern for doctor-service / patient-admin-service)
```
feature/
├── feature.module.ts           # Module declarations
├── feature.controller.ts       # Routes with @Controller, @Get, @Post etc.
├── feature.service.ts          # @Injectable business logic
├── entities/feature.entity.ts  # TypeORM entity (PostgreSQL) OR
├── schemas/feature.schema.ts   # Mongoose schema (MongoDB)
└── dto/
    ├── create-feature.dto.ts
    └── update-feature.dto.ts
```

### Spring Boot Package Structure (pattern for Java services)
```
com.ezclinic.{service}/
├── controller/{Feature}Controller.java
├── service/{Feature}Service.java
├── model/{Feature}.java               # JPA entity
├── repository/{Feature}Repository.java
├── dto/{Feature}Dto.java
├── config/
└── {service}Application.java
```

### Adding a New Feature (Checklist)
1. **Identify the owning service** based on domain (doctor data → doctor-service, patient data → patient-admin-service, etc.)
2. **Backend:**
   - Add entity/schema
   - Add DTO with validation
   - Add service method
   - Add controller route
   - Register in module (NestJS) / Spring auto-scans (Spring Boot)
3. **Events (if async side effects needed):**
   - Publish RabbitMQ event from appointment-payment-service
   - Add listener in telemedicine-notification-service
4. **Frontend:**
   - Add page under `frontend/src/app/`
   - Use `apiFetch()` from `lib/api.ts` for all API calls
   - Use `getSession()` from `lib/auth.ts` for auth checks
   - Add navigation in `components/Sidebar.tsx` (role-gated)
5. **Environment variables:** Add to `.env.example` and relevant service config
6. **File uploads:** Route through patient-admin-service (uses AWS S3 multipart)

---

## 12. Scripts & Commands

| Service | Dev Command | Build | Port |
|---------|------------|-------|------|
| frontend | `npm run dev` | `npm run build` | 3000 |
| doctor-service | `npm run dev` | `npm run build` | 3002 |
| patient-admin-service | `npm run dev` | `npm run build` | 3005 |
| appointment-payment-service | `mvn spring-boot:run` | `mvn clean install` | 3004 |
| telemedicine-notification-service | `./gradlew bootRun` | `./gradlew clean build` | 8090 |

**Docker:**
```bash
docker compose up -d          # Start all
docker compose logs -f        # Tail logs
docker compose down -v        # Stop + remove volumes
docker compose build          # Rebuild images
```

---

## 13. Environment Variables Reference

```env
# Databases
DATABASE_URL=postgresql://postgres:<pass>@<host>:5432/postgres
SUPABASE_DB_URL=jdbc:postgresql://<host>:5432/postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=<password>
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/doctor_db

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

# Auth (all services share same JWT secret)
JWT_SECRET=<shared secret>

# Auth0 (legacy/optional)
AUTH0_DOMAIN=dev-6x78k6ttww4d1cif.us.auth0.com
AUTH0_CLIENT_ID=<id>
AUTH0_CLIENT_SECRET=<secret>
AUTH0_SECRET=<random 32-char>
AUTH0_AUDIENCE=https://api.ezclinic.com

# Service URLs (for inter-service HTTP calls)
DOCTOR_SERVICE_URL=http://doctor-service:3002
PATIENT_SERVICE_URL=http://patient-admin-service:3005
APPOINTMENT_SERVICE_URL=http://appointment-payment-service:3004
TELEMEDICINE_SERVICE_URL=http://telemedicine-notification-service:8090

# Frontend (public, browser-visible)
NEXT_PUBLIC_PATIENT_API=http://localhost:3005/api/v1
NEXT_PUBLIC_DOCTOR_API=http://localhost:3002/api/v1
NEXT_PUBLIC_APPOINTMENT_API=http://localhost:3004/api/v1
NEXT_PUBLIC_TELEMEDICINE_API=http://localhost:8090/api/v1

# Third-party
PAYHERE_MERCHANT_ID=<id>
PAYHERE_MERCHANT_SECRET=<secret>
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=<id>
JITSI_APP_SECRET=<secret>
MAILTRAP_API_KEY=<key>
MAILTRAP_SENDER=noreply@ezclinic.com
GEMINI_API_KEY=<key>
GEMINI_MODEL=gemini-2.5-flash
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_S3_BUCKET=<bucket>
AWS_REGION=<region>

# Frontend origin
FRONTEND_URL=http://localhost:3000
```
