# ezClinic — Copilot Agent Implementation Plan

> **Project:** ezClinic — Cloud-Native Healthcare Platform  
> **Stack:** Next.js 16 (TypeScript), NestJS, Spring Boot, PostgreSQL/Supabase, Auth0, Docker, Kubernetes, RabbitMQ, Jitsi Meet, PayHere

---

## 0. Agent Primer — Read This First

You are a senior full-stack engineer working on **ezClinic**, a production-grade telemedicine platform. Your job is to audit every service and the frontend, identify broken or incomplete areas, and rewrite or fix them so the entire platform is coherent, secure, and professional.

### Auth Pattern (Auth0 — do NOT change)
The platform uses **Auth0 with `@auth0/nextjs-auth0`**. The session cookie (`__session__0` + `__session__1`) contains a JWT with a custom claim:

```json
{
  "https://ezclinic.com/roles": ["patient"],
  "sub": "auth0|69dbd034853a0d3ffe6c8ff1",
  "email": "patient@example.com"
}
```

- The `/auth/profile` route (Next.js API route) returns the decoded JWT payload.
- All downstream microservices receive the Auth0 JWT as a `Bearer` token in `Authorization` header.
- **Every microservice must validate this JWT against Auth0's JWKS endpoint** (`https://dev-6x78k6ttww4d1cif.us.auth0.com/.well-known/jwks.json`).
- Role extraction: `payload["https://ezclinic.com/roles"][0]` → `patient | doctor | admin`.
- The `sub` field is the stable user ID to use as `patientId` / `doctorId` across all services.

---

## 1. Audit Checklist — Do This Before Writing Any Code

For **each service**, verify:
- [ ] Does it start without errors (`npm run start:dev` or `mvn spring-boot:run`)?
- [ ] Does it validate Auth0 JWTs correctly?
- [ ] Are all documented endpoints returning correct HTTP status codes?
- [ ] Is Swagger/OpenAPI up to date and reachable at `/api-docs` or `/swagger-ui`?
- [ ] Does it publish/consume RabbitMQ events where required?
- [ ] Does it have a working `Dockerfile` and health check endpoint?

---

## 2. Service-by-Service Implementation Guide

---

### 2.1 `patient-admin-service` (NestJS — **Priority: High**)

**Responsibilities:** Patient registration & profile, medical report uploads (S3), Admin user management & doctor verification.

#### Issues to Fix
- Ensure JWT guard reads Auth0 token, not a local JWT secret.
- `PatientModule`: confirm `sub` (Auth0 user ID) is used as primary key, not an auto-generated UUID.
- File upload: validate file type (PDF, JPEG, PNG only) and max size (10 MB). Return a signed S3 URL on upload, not the raw S3 key.
- Admin endpoints must check `https://ezclinic.com/roles` contains `admin`.

#### Endpoints to Implement / Verify

```
# Auth
GET  /auth/profile          → Returns Auth0 profile + role (proxy from Next.js)

# Patient
POST   /patients/register   → Create patient profile (idempotent on sub)
GET    /patients/me         → Get own profile (patient role)
PATCH  /patients/me         → Update profile
POST   /patients/me/reports → Upload medical report → returns { reportId, url }
GET    /patients/me/reports → List all uploaded reports

# Admin
GET    /admin/patients              → List all patients (paginated)
PATCH  /admin/patients/:id/suspend  → Suspend account
GET    /admin/doctors/pending       → Doctors awaiting verification
PATCH  /admin/doctors/:id/verify    → Approve/reject doctor

# Health
GET /health  → { status: "ok" }
```

#### Swagger
- Add `@ApiTags`, `@ApiBearerAuth()`, `@ApiResponse()` to every controller method.
- Run `npx @nestjs/swagger` CLI to export `swagger.yaml` to `docs/`.

---

### 2.2 `doctor-service` (NestJS — **Priority: High**)

**Responsibilities:** Doctor profile, availability slots, prescription management.

#### Issues to Fix
- Remove local JWT; replace with Auth0 JWKS validation (`jwks-rsa` + `passport-jwt`).
- MongoDB is used alongside PostgreSQL — clarify split: use **PostgreSQL (TypeORM)** for structured doctor data & availability; **MongoDB (Mongoose)** only for prescription documents.
- Availability slots must prevent double-booking (add unique constraint on `doctorId + date + startTime`).

#### Endpoints to Implement / Verify

```
# Doctor Profile
POST  /doctors/register         → Register after Auth0 signup (idempotent on sub)
GET   /doctors/me               → Own profile (doctor role)
PATCH /doctors/me               → Update profile/specialization

# Availability
POST   /doctors/me/availability           → Add slot { date, startTime, endTime }
GET    /doctors/me/availability           → List own slots
DELETE /doctors/me/availability/:slotId   → Remove slot

# Public (any authenticated user)
GET /doctors                    → Browse doctors (filter: ?specialty=&name=)
GET /doctors/:id                → Doctor detail + available slots

# Prescriptions
POST /prescriptions             → Issue prescription (doctor role)
GET  /prescriptions/:appointmentId  → Get prescription by appointment
GET  /patients/:patientId/prescriptions → Doctor fetches patient's prescriptions

# Health
GET /health → { status: "ok" }
```

---

### 2.3 `appointment-payment-service` (Spring Boot — **Priority: High — likely rewrite**)

> **Decision:** The project has TWO appointment services (`appointment-booking-service` and `appointment-payment-service`). **Consolidate into one service** (`appointment-payment-service`) using Spring Boot 3.4.4. Remove `appointment-booking-service` entirely.

#### Issues to Fix
- Replace any local JWT logic with Spring Security OAuth2 Resource Server pointed at Auth0.
- Add `application.yml`:
  ```yaml
  spring:
    security:
      oauth2:
        resourceserver:
          jwt:
            issuer-uri: https://dev-6x78k6ttww4d1cif.us.auth0.com/
  ```
- PayHere integration: hash generation must use `merchant_id + order_id + amount + currency + MD5(merchant_secret)` — verify this is correct.
- RabbitMQ: publish `appointment.booked`, `appointment.cancelled` events.

#### Endpoints to Implement / Verify

```
# Appointments
POST   /appointments                → Book appointment { doctorId, slotId, date, type }
GET    /appointments/my             → Patient's appointments
GET    /appointments/doctor         → Doctor's appointments
PATCH  /appointments/:id/cancel     → Cancel
PATCH  /appointments/:id/reschedule → Reschedule { newSlotId, newDate }
GET    /appointments/:id/status     → Real-time status

# Payment
POST /payments/checkout             → Generate PayHere params + hash
POST /payments/notify               → PayHere webhook (no auth, verify hash internally)
GET  /payments/:appointmentId/status → Payment status

# Health
GET /health → { status: "ok" }
```

---

### 2.4 `telemedicine-notification-service` (Spring Boot — **Priority: Medium**)

**Responsibilities:** Jitsi Meet sessions, email/SMS notifications, AI symptom checker.

#### Issues to Fix
- Jitsi JWT room tokens must be signed with the Jitsi app secret. Verify the signing logic.
- Mailtrap: ensure templates are used, not raw text.
- SymptomCheckController: if using an external AI API (e.g., OpenAI), ensure the API key is read from environment variables, not hardcoded.
- RabbitMQ listeners: listen to `appointment.booked` → send confirmation email/SMS to both parties.

#### Endpoints to Implement / Verify

```
# Telemedicine Sessions
POST /sessions                  → Create Jitsi session { appointmentId } → { roomName, token, joinUrl }
GET  /sessions/:appointmentId   → Get session details
POST /sessions/:id/end          → End session + trigger post-session notification

# Notifications
POST /notifications/email       → Send email (internal use / admin)
POST /notifications/sms         → Send SMS (internal use / admin)

# Symptom Checker
POST /symptom-check             → { symptoms: string[] } → { suggestions, recommendedSpecialties }

# Health
GET /health → { status: "ok" }
```

---

## 3. Frontend Redesign (Next.js — **Priority: Critical**)

The UI must be **professional, consistent, and responsive**. Treat it as a real production medical platform.

### 3.1 Design System

Establish a consistent design system in `src/styles/` or via Tailwind config:

```js
// tailwind.config.ts
colors: {
  primary: { DEFAULT: '#0EA5E9', dark: '#0284C7' },   // Sky blue — medical
  secondary: { DEFAULT: '#10B981' },                   // Emerald — health
  danger: '#EF4444',
  warning: '#F59E0B',
  surface: '#F8FAFC',
  border: '#E2E8F0',
}
```

Use **Shadcn/UI** components (install via `npx shadcn@latest init`) for: Button, Card, Dialog, Table, Badge, Input, Select, Avatar, Toast.

### 3.2 Layout

**Navbar** (`src/components/Navbar.tsx`):
- Logo left, user avatar + name + role badge right
- Notification bell with unread count
- Logout button

**Sidebar** (`src/components/Sidebar.tsx`):
- Role-aware navigation links
- Patient: Dashboard, Find Doctors, My Appointments, Medical Reports, Prescriptions, Symptom Checker
- Doctor: Dashboard, My Schedule, Appointments, Prescriptions
- Admin: Dashboard, Manage Doctors, Manage Patients

### 3.3 Pages to Build / Fix

#### `/` — Home / Role Router
```
if role === admin    → redirect /admin
if role === doctor   → redirect /dashboard
if role === patient  → redirect /profile
```

#### `/profile` — Patient Profile
- Editable form: name, phone, DOB, blood group, address
- Avatar upload
- Medical history summary cards

#### `/doctors` — Browse Doctors
- Search bar + specialty filter chips
- Doctor cards: photo, name, specialty, rating, next available slot
- Pagination

#### `/doctors/[id]` — Doctor Detail
- Doctor info panel + availability calendar
- Book Appointment CTA → opens booking modal

#### `/appointments` — My Appointments
- Tabs: Upcoming | Past | Cancelled
- Each card: doctor info, date/time, status badge, action buttons (Join/Cancel/Reschedule)

#### `/telemedicine/[sessionId]` — Video Consultation
- Embedded Jitsi Meet iframe or Jitsi SDK
- Prescription panel (doctor only) on the right
- Session timer

#### `/reports` — Medical Reports
- Upload dropzone (drag & drop)
- Report list with file type icon, upload date, download link

#### `/prescriptions` — My Prescriptions
- Card list: medication, dosage, issued by, date

#### `/symptom-checker` — AI Symptom Checker
- Multi-select symptom input
- Submit → display suggestions and recommended doctor specialties
- Link to browse doctors by recommended specialty

#### `/dashboard` — Doctor Dashboard
- Today's appointments list
- Upcoming schedule
- Quick stats: total patients, consultations this month

#### `/availability` — Doctor Schedule Management
- Weekly calendar view
- Click slot to add/remove availability

#### `/admin` — Admin Dashboard
- Stats cards: total patients, total doctors, pending verifications, revenue
- Recent activity feed

#### `/admin/doctors` — Doctor Verification
- Table: name, email, specialty, submitted date, status
- Approve / Reject buttons → confirmation modal

#### `/admin/patients` — Patient Management
- Table with search, suspend/reactivate

### 3.4 API Integration (`src/lib/api.ts`)

```ts
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const tokenRes = await fetch('/api/auth/token');
  const { accessToken } = await tokenRes.json();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### 3.5 Environment Variables (`.env.local`)

```
NEXT_PUBLIC_API_GATEWAY=http://localhost:8000
AUTH0_SECRET=<32-char-secret>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://dev-6x78k6ttww4d1cif.us.auth0.com
AUTH0_CLIENT_ID=lnaFzpt1SRXRwizxj9XMYkQV4BsJvXuD
AUTH0_CLIENT_SECRET=<from auth0 dashboard>
AUTH0_AUDIENCE=<your Auth0 API identifier>
```

---

## 4. API Gateway (Kong — DevOps / Minidu)

Configure Kong routes for all services:

| Route Prefix | Upstream Service | Port |
|---|---|---|
| `/api/patients` | patient-admin-service | 3001 |
| `/api/admin` | patient-admin-service | 3001 |
| `/api/doctors` | doctor-service | 3002 |
| `/api/prescriptions` | doctor-service | 3002 |
| `/api/appointments` | appointment-payment-service | 8080 |
| `/api/payments` | appointment-payment-service | 8080 |
| `/api/sessions` | telemedicine-notification-service | 8082 |
| `/api/symptom-check` | telemedicine-notification-service | 8082 |
| `/api/notifications` | telemedicine-notification-service | 8082 |

Add Kong **JWT plugin** on all routes to validate Auth0 tokens at the gateway level.

---

## 5. RabbitMQ Event Bus

| Event | Publisher | Consumers |
|---|---|---|
| `appointment.booked` | appointment-payment-service | telemedicine-notification-service |
| `appointment.cancelled` | appointment-payment-service | telemedicine-notification-service |
| `appointment.rescheduled` | appointment-payment-service | telemedicine-notification-service |
| `payment.completed` | appointment-payment-service | telemedicine-notification-service |
| `doctor.verified` | patient-admin-service | doctor-service |

Exchange: `ezclinic.events` (topic), durable.

---

## 6. Docker & Kubernetes

### Docker Compose (dev)
Each service must have:
- `Dockerfile` with multi-stage build
- `HEALTHCHECK` instruction
- Non-root user

### Kubernetes (prod)
Each service needs:
- `Deployment` with `readinessProbe` and `livenessProbe` hitting `/health`
- `Service` (ClusterIP)
- `ConfigMap` for non-secret config
- `Secret` for DB passwords, Auth0 secrets, API keys
- `HorizontalPodAutoscaler` (min 1, max 3)

---

## 7. Swagger / OpenAPI Standards

Every service must expose OpenAPI docs:

- NestJS: `@nestjs/swagger` → `/api-docs`
- Spring Boot: `springdoc-openapi` → `/swagger-ui/index.html`

Every endpoint must document:
- `@ApiOperation({ summary: '...' })`
- `@ApiBearerAuth()`
- All `@ApiResponse({ status: ..., description: '...' })`
- Request/Response DTOs with `@ApiProperty()`

---

## 8. Security Checklist

- [ ] All endpoints (except `/health` and PayHere `/notify` webhook) require valid Auth0 JWT
- [ ] Role-based guards on every sensitive endpoint
- [ ] File uploads: validate MIME type server-side (not just extension)
- [ ] PayHere webhook: verify MD5 hash before processing
- [ ] No secrets in source code — use `.env` / Kubernetes Secrets
- [ ] CORS: restrict to frontend origin in production
- [ ] HTTPS only in production (cert via Let's Encrypt or cloud TLS)

---

## 9. Coding Standards

- **TypeScript:** strict mode, no `any`
- **Java:** Lombok for boilerplate, MapStruct for DTO mapping
- **Error handling:** Global exception filters (NestJS) / `@ControllerAdvice` (Spring) returning `{ error: string, statusCode: number, timestamp: string }`
- **Validation:** `class-validator` (NestJS) / Spring `@Valid` on all request bodies
- **Logging:** structured JSON logs, include `requestId` in every log line

---

## 10. Testing

After each service is fixed:
1. Run all existing unit tests
2. Write integration tests for at least the critical happy paths
3. Test with the real Auth0 token (patient role): use the curl from the project context as a baseline
4. Verify Swagger UI reflects actual behavior
