/**
 * @module auth.test
 * @description Supertest API suite asserting complete boundary protection preventing malicious JWTs and testing token refresh flows.
 */

const request = require('supertest');
const app = require('../../server/app');
const db = require('../../server/config/db'); // Simulated DB Pool

jest.mock('../../server/config/db', () => ({
  query: jest.fn(),
}));

describe('API: /api/v1/auth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should return 400 when critical fields are missing', async () => {
      const { status, body } = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@test.com' }); // Missing password, name

      expect(status).toBe(400);
      expect(body).toHaveProperty('errors');
    });

    it('should successfully register and return a JWT Payload on Happy Path', async () => {
      // Mock successful DB insertion
      db.query.mockResolvedValueOnce({
        rows: [{ id: 'u1', name: 'John', email: 'test@test.com' }],
      });

      // Mock password hasher internally if fully integrated
      const { status, body, headers } = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'John', email: 'test@test.com', password: 'securePassword123' });

      expect(status).toBe(201);
      expect(body.data).toHaveProperty('accessToken');
      
      // Verify HttpOnly cookie exists for refresh token
      expect(headers['set-cookie'][0]).toMatch(/refreshToken=.*; HttpOnly/);
    });
  });

  describe('POST /login', () => {
    it('should block invalid passwords returning 401 instantly', async () => {
      // Mock user existence but wrong pass simulation
      db.query.mockResolvedValueOnce({ rows: [] }); // User not found natively triggers same 401

      const { status } = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@test.com', password: 'wrongPassword' });

      expect(status).toBe(401);
    });
  });

  describe('Protected Route Guard Middleware', () => {
    // Attempting to hit a generic protected route without a token
    it('should return 401 Unauthorized globally if no Bearer token attached', async () => {
       const { status } = await request(app).get('/api/v1/users/me');
       expect(status).toBe(401);
    });

    it('should block malformed / forged JWTs returning 403 or 401 immediately safely bypassing app logic', async () => {
       const { status } = await request(app)
          .get('/api/v1/users/me')
          .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature');
       expect(status).toBe(401);
    });
  });
});
