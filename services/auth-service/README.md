# ezClinic – Auth & Security Service

> **Port:** 3003 · **Owner:** Kaveen · **Stack:** Spring Boot 3.4 · Spring Security · OAuth2 RS · JPA · PostgreSQL (Supabase) · Swagger

## Features
- **Registration** — Creates user in Auth0 + local DB with role assignment
- **Login** — Exchanges credentials for Auth0 JWT  
- **Current User** — Resolves profile from JWT `sub` claim
- **RBAC** — Patient, Doctor, Admin via `@PreAuthorize`
- **User Management (Admin)** — List users, update roles
- **Swagger UI** — `/api/v1/swagger-ui.html`

## Quick Start
```bash
cp .env.example .env    # fill in Auth0 + DB credentials
mvn clean install
mvn spring-boot:run     # http://localhost:3003
```

## API Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Register user | Public |
| `POST` | `/api/v1/auth/login` | Login, returns JWT | Public |
| `GET`  | `/api/v1/auth/me` | Current user | Bearer |
| `GET`  | `/api/v1/users` | List users | Admin |
| `GET`  | `/api/v1/users/{id}` | Get user | Admin |
| `PUT`  | `/api/v1/users/{id}/role` | Update role | Admin |
| `GET`  | `/api/v1/health` | Health check | Public |
