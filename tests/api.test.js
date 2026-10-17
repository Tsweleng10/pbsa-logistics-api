// tests/api.test.js
const request = require('supertest');
const app = require('../server');
const { pool } = require('../db');

// Close the database pool after all tests finish
// (Prevents Jest from hanging with "Open Handles" warning)
afterAll(async () => {
  await pool.end();
});

describe('Health Check', () => {
  it('GET / - should return API status', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});

describe('Authentication API', () => {
  const testUser = {
    full_name: 'Test QA User',
    email: `qa${Date.now()}@pbsa.co.za`, // Unique email every run
    password: 'Password123!',
    role: 'DRIVER',
  };

  let token;

  it('POST /api/auth/register - should create a new user and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toEqual(testUser.email);
    // Ensure password is not returned
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('POST /api/auth/register - should fail on invalid input (Joi validation)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '123' }); // Invalid

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  it('POST /api/auth/login - should authenticate and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token; // Save token for protected route tests
  });

  it('GET /api/auth/me - should block requests without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toMatch(/Authentication required/);
  });

  it('GET /api/auth/me - should return user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toEqual(testUser.email);
  });
});

describe('ELD API', () => {
  let driverToken;

  beforeAll(async () => {
    // Log in as seeded driver1
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver1@pbsa.co.za', password: 'Password123!' });
    driverToken = res.body.token;
  });

  it('POST /api/eld/clock-in - should reject invalid duty status', async () => {
    const res = await request(app)
      .post('/api/eld/clock-in')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ duty_status: 'INVALID_STATUS' });

    expect(res.statusCode).toEqual(400);
  });
});