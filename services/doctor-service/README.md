# ezClinic – Doctor Management Service

> **Port:** 3002  
> **Owner:** Nethmi  
> **Stack:** NestJS · TypeORM · PostgreSQL (Supabase) · Swagger

## Features

- **Doctor Profiles** — Register, view, update, and delete doctor profiles.
- **Availability Scheduling** — CRUD operations on weekly availability time-slots.
- **Digital Prescriptions** — Issue, list, and view prescriptions linked to appointments.
- **Swagger UI** — Interactive API docs at `/api/docs`.

## Project Structure

```
src/
├── app.module.ts              # Root module
├── app.controller.ts          # Health check
├── app.service.ts
├── main.ts                    # Bootstrap (port 3002)
└── doctor/
    ├── doctor.module.ts       # Feature module
    ├── doctor.controller.ts   # Profile & availability endpoints
    ├── doctor.service.ts      # Business logic
    ├── dto/
    │   ├── create-doctor.dto.ts
    │   ├── update-doctor.dto.ts
    │   ├── create-availability.dto.ts
    │   └── update-availability.dto.ts
    ├── entities/
    │   ├── doctor.entity.ts
    │   └── availability.entity.ts
    └── prescription/
        ├── prescription.module.ts
        ├── prescription.controller.ts
        ├── prescription.service.ts
        ├── dto/
        │   └── create-prescription.dto.ts
        └── entities/
            └── prescription.entity.ts
```

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.example .env

# 3. Start in dev mode (hot-reload)
npm run start:dev
```

The service will start on **http://localhost:3002** with Swagger docs at **http://localhost:3002/api/docs**.

## API Endpoints (Quick Reference)

| Method   | Endpoint                                      | Description                   |
|----------|-----------------------------------------------|-------------------------------|
| `GET`    | `/api/v1/`                                    | Health check                  |
| `POST`   | `/api/v1/doctors/register`                    | Register a new doctor         |
| `GET`    | `/api/v1/doctors`                             | List verified doctors         |
| `GET`    | `/api/v1/doctors/:id`                         | Get doctor profile            |
| `PUT`    | `/api/v1/doctors/:id`                         | Update doctor profile         |
| `DELETE` | `/api/v1/doctors/:id`                         | Delete doctor                 |
| `POST`   | `/api/v1/doctors/:doctorId/availability`      | Add availability slot         |
| `GET`    | `/api/v1/doctors/:doctorId/availability`      | Get availability slots        |
| `PUT`    | `/api/v1/doctors/:doctorId/availability/:id`  | Update availability slot      |
| `DELETE` | `/api/v1/doctors/:doctorId/availability/:id`  | Delete availability slot      |
| `POST`   | `/api/v1/doctors/:doctorId/prescriptions`     | Issue a prescription          |
| `GET`    | `/api/v1/doctors/:doctorId/prescriptions`     | List doctor's prescriptions   |
| `GET`    | `/api/v1/patients/:patientId/prescriptions`   | View patient's prescriptions  |
| `GET`    | `/api/v1/prescriptions/:id`                   | Get a specific prescription   |

## Environment Variables

| Variable          | Description                        | Default               |
|-------------------|------------------------------------|------------------------|
| `PORT`            | Service port                       | `3002`                 |
| `NODE_ENV`        | Environment                        | `development`          |
| `DB_HOST`         | PostgreSQL host                    | `localhost`            |
| `DB_PORT`         | PostgreSQL port                    | `5432`                 |
| `DB_USER`         | DB username                        | `postgres`             |
| `DB_PASSWORD`     | DB password                        | —                      |
| `DB_NAME`         | Database name                      | `ezclinic_doctor_db`   |
| `AUTH0_DOMAIN`    | Auth0 tenant domain                | —                      |
| `AUTH0_AUDIENCE`  | Auth0 API audience                 | —                      |
| `JWT_SECRET`      | Internal JWT secret                | —                      |
| `RABBITMQ_URL`    | RabbitMQ connection URL            | `amqp://localhost:5672`|
