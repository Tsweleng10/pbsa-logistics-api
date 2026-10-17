# PBSA Logistics API 🚛

Backend REST API for the **PBSA Logistics** Android mobile application.

## Table of Contents

- [Overview](#overview)
- [Team](#team)
- [Live Deployment](#live-deployment)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Testing & CI/CD](#testing--cicd)
- [Authentication & Roles](#authentication--roles)
- [API Reference](#api-reference)
- [Security & POPIA](#security--popia)
- [Test Credentials](#test-credentials)
- [License](#license)

---

## Overview

This API is the backend for the PBSA Logistics mobile app. It provides:

- **User authentication** with role-based access for Drivers and Dispatchers
- **Load management**: creation, assignment and status tracking
- **ELD tracking**: Electronic Logging Device duty periods for drivers
- **System alerts**: dispatcher-to-user notifications

| | |
|---|---|
| **Module** | XISD6329 – Work Integrated Learning (Task 2) |
| **Team** | LogiLink |
| **Institution** | Rosebank College |

## Team

| Member | Student No. | Role |
|---|---|---|
| Raesibe Kate Galane | ST10450352 | Project Manager / UI-UX Designer |
| Fortune Pheagane Lemekwana | ST10450241 | Frontend Web Developer |
| Joshua Regaugetswe Tsweleng | ST10451745 | Backend Developer / QA Tester |
| Phuti Magwai | ST10452585 | Android Developer |

---

## Live Deployment

Hosted on **Railway**, connected to a **Neon PostgreSQL** database.

- **Base URL:** https://pbsa-logistics-api-production.up.railway.app
- **Health check:** send a `GET` request to the base URL (`/`) to confirm the server is running.

```bash
curl <YOUR-RAILWAY-URL>/
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (v20+) |
| Framework | Express.js |
| Database | PostgreSQL (Neon Cloud) |
| Auth | JSON Web Tokens (JWT) + bcrypt |
| Validation | Joi |
| Testing | Jest + Supertest |
| CI/CD | GitHub Actions |
| Hosting | Railway |

---

## Getting Started

### Prerequisites

- Node.js v24 or higher
- A PostgreSQL database (a free [Neon](https://neon.tech) project works)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Tsweleng10/pbsa-logistics-api.git
   cd pbsa-logistics-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the project root:

   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   ```

   > ⚠️ Never commit `.env`. Make sure it is listed in `.gitignore`.

4. **Initialise the database schema**

   ```bash
   node init-db.js
   ```

5. **Seed sample data** (10+ records per table)

   ```bash
   node seed.js
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`.

---

## Testing & CI/CD

Run the automated test suite locally:

```bash
npm test
```

GitHub Actions runs the test suite automatically on every push to `main`.

---

## Authentication & Roles

Protected endpoints require a JWT, obtained from `/api/auth/login` and sent in the `Authorization` header:

```bash
# 1. Log in
curl -X POST <BASE_URL>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "driver1@pbsa.co.za", "password": "Password123!"}'

# 2. Use the returned token
curl <BASE_URL>/api/auth/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

| Access level | Meaning |
|---|---|
| **Public** | No token required |
| **Protected** | Any authenticated user |
| **Driver** | Authenticated user with the Driver role |
| **Dispatcher** | Authenticated user with the Dispatcher role |

---

## API Reference

### 🔐 Authentication: `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new user (Driver/Dispatcher) |
| POST | `/login` | Public | Authenticate and receive a JWT |
| GET | `/me` | Protected | Get the current user's profile |
| PUT | `/settings` | Protected | Update name / phone number |
| PUT | `/change-password` | Protected | Change password (requires old password) |

### 📦 Loads: `/api/loads`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Dispatcher | Get all loads in the system |
| GET | `/my` | Driver | Get loads assigned to the logged-in driver |
| GET | `/:id` | Protected | Get details for a specific load |
| POST | `/` | Dispatcher | Create a new load |
| PUT | `/:id/status` | Driver | Update load status (e.g. `IN_TRANSIT`) |

### ⏱️ ELD Logs: `/api/eld`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/clock-in` | Driver | Start a duty period (Driving, On Duty, etc.) |
| POST | `/clock-out` | Driver | End the current duty period |
| GET | `/my` | Driver | View personal ELD history |

### 🔔 Alerts: `/api/alerts`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Protected | Get the logged-in user's alerts |
| PUT | `/:id/read` | Protected | Mark an alert as read |
| POST | `/` | Dispatcher | Send a new alert to a user |

---

## Security & POPIA

- **Password hashing:** passwords are hashed with bcrypt (10 salt rounds) before storage. Plain-text passwords are never saved.
- **SQL injection prevention:** all queries use parameterised inputs (`$1`, `$2`, ...).
- **Input validation:** Joi middleware rejects malformed requests with a clean `400 Bad Request` instead of crashing the server.
- **Role-based access control:** endpoints are restricted by JWT role (Driver / Dispatcher).
- **POPIA alignment:** the API is designed to limit exposure of personal information and to prevent unauthorised enumeration of users.

---

## Test Credentials

For **local development and demo only**. These exist after running `node seed.js`.

All seeded users share the password: `Password123!`

| Role | Email |
|---|---|
| Driver | `driver1@pbsa.co.za` |
| Dispatcher | `dispatch1@pbsa.co.za` |

> ⚠️ Do not seed or use these credentials in a production database.

---

## License

This project is for academic purposes as part of the XISD6329 module at Rosebank College.

© 2026 LogiLink Team.
