# PBSA Logistics API 🚛

[![PBSA API CI Pipeline](https://github.com/YOUR-USERNAME/pbsa-logistics-api/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR-USERNAME/pbsa-logistics-api/actions/workflows/ci.yml)

Backend REST API for the PBSA Logistics Android mobile application. 

## 📖 Project Overview
This API serves as the backend infrastructure for the PBSA Logistics mobile app. It handles user authentication, load management, Electronic Logging Device (ELD) tracking for drivers, and system alerts.

**Module:** XISD6329 – Work Integrated Learning (Task 2)  
**Team:** LogiLink  
**Institution:** Rosebank College  

### 👥 Team Members
* **Raesibe Kate Galane** (ST10450352) – Project Manager / UI-UX Designer
* **Fortune Pheagane Lemekwana** (ST10450241) – Frontend Web Developer
* **Joshua Regaugetswe Tsweleng** (ST10451745) – Android Developer / QA Tester
* **Phuti Magwai** (ST10452585) – Backend Developer

---

## 🌐 Live Deployment
The API is currently hosted on **Railway** and connected to a **Neon PostgreSQL** database.

* **Live Base URL:** `<https://pbsa-logistics-api-production.up.railway.app/>` *(e.g., https://pbsa-logistics-api-production.up.railway.app)*
* **Status Check:** Append `/` to the base URL to verify the server is running.

---

## 🛠️ Tech Stack
* **Runtime:** Node.js (v20+)
* **Framework:** Express.js
* **Database:** PostgreSQL (Neon Cloud)
* **Authentication:** JSON Web Tokens (JWT) & bcrypt
* **Validation:** Joi
* **Testing:** Jest & Supertest
* **CI/CD:** GitHub Actions
* **Hosting:** Railway

---

## 🚀 Local Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/pbsa-logistics-api.git
   cd pbsa-logistics-api
