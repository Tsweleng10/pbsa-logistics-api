# PBSA Logistics API

Backend REST API for the PBSA Logistics Android mobile application.

## Module
XISD6329 — Work Integrated Learning (Task 2)

## Team — LogiLink
- Raesibe Kate Galane (ST10450352) — Project Manager / UI-UX
- Fortune Pheagane Lemekwana (ST10450241) — Frontend Developer
- Joshua Regaugetswe Tsweleng (ST10451745) — Backend Developer 
- Phuti Magwai (ST10452585) — 
Android Developer / QA
## Tech Stack
- Node.js + Express.js
- PostgreSQL (Neon)
- JWT Authentication
- bcrypt Password Hashing
- Joi Validation
- Jest + Supertest (automated tests)
- GitHub Actions (CI/CD)

## Setup

```bash
npm install
cp .env.example .env   # then fill in real values
node seed.js           # populate database
npm run dev            # start dev server
npm test               # run automated tests