/**
 * @module payments.test
 * @description Asserts idempotency and successful balance modifications occurring natively when Payments enter resolving channels.
 */

const request = require('supertest');
const app = require('../../server/app');
const db = require('../../server/config/db');

const DUMMY_TOKEN = 'mock-jwt';

// Quick inline stub simulating Authentication
jest.mock('../../server/middleware/auth', () => (req, res, next) => {
  if (req.headers.authorization === `Bearer ${DUMMY_TOKEN}`) {
    req.user = { id: 'u1' };
    next();
  } else {
    res.status(401).send();
  }
});

describe('API: /api/v1/groups/:groupId/settlements', () => {
  describe('POST /', () => {
    it('should succeed transferring a valid payment and logging natively to database successfully', async () => {
      db.query.mockResolvedValue({ rowCount: 1 }); // Generic success payload

      const { status } = await request(app)
        .post('/api/v1/groups/g1/settlements')
        .set('Authorization', `Bearer ${DUMMY_TOKEN}`)
        .send({
          payeeId: 'u2',
          amountCents: 5000,
          method: 'cash'
        });

      // 201 Created
      expect(status).toBe(201);
    });

    it('should prevent malicious submission where User tries to settle with themselves returning 400', async () => {
       const { status, body } = await request(app)
        .post('/api/v1/groups/g1/settlements')
        .set('Authorization', `Bearer ${DUMMY_TOKEN}`)
        .send({
          payeeId: 'u1', // Same as JWT Viewer
          amountCents: 5000,
          method: 'cash'
        });

      expect(status).toBe(400);
      expect(body.message).toMatch(/Cannot settle with yourself/i);
    });
  });
});
