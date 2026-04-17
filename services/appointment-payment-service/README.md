# ezClinic – Appointment & Payment Service

> **Port:** 3004 · **Owner:** Kaveen · **Stack:** Spring Boot 3.4 · JPA · PostgreSQL · Stripe · Swagger

## Features
- **Doctor Search** — Proxy to doctor-service for searching by specialization
- **Appointment Booking** — Book, modify, cancel, track appointments
- **Stripe Payments** — Checkout sessions, webhook-based payment confirmation
- **RBAC** — Patients book/modify, Doctors confirm/complete, via Auth0 JWT
- **Swagger UI** — `/api/v1/swagger-ui.html`

## Quick Start
```bash
cp .env.example .env
mvn clean install
mvn spring-boot:run     # http://localhost:3004
```

## API Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/appointments/doctors` | Search doctors | Bearer |
| `GET` | `/api/v1/appointments/doctors/:id/availability` | Availability | Bearer |
| `POST` | `/api/v1/appointments` | Book appointment | Bearer |
| `GET` | `/api/v1/appointments` | My appointments | Bearer |
| `GET` | `/api/v1/appointments/doctor` | Doctor's appointments | Bearer |
| `GET` | `/api/v1/appointments/{id}` | Get appointment | Bearer |
| `PUT` | `/api/v1/appointments/{id}` | Modify appointment | Bearer |
| `PATCH` | `/api/v1/appointments/{id}/cancel` | Cancel | Bearer |
| `PATCH` | `/api/v1/appointments/{id}/status` | Update status | Bearer |
| `POST` | `/api/v1/payments/checkout/{id}` | Stripe checkout | Bearer |
| `POST` | `/api/v1/payments/webhook` | Stripe webhook | Public |
| `GET` | `/api/v1/payments/{id}` | Payment status | Bearer |

## Stripe Testing
Use test card `4242 4242 4242 4242` with any future expiry and CVC.
