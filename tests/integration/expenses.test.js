/**
 * @module expenses.test
 * @description Simulates End-to-End API creation flow natively within Express hitting validation gates, 
 *              processing split logic arrays, and saving to mocked DB layers.
 */

const request = require('supertest');
const app = require('../../server/app');
const db = require('../../server/config/db');

// Setup a dummy token specifically for the Authorization guard
const DUMMY_TOKEN = 'mock-jwt-token';
const groupId = 'g1';

jest.mock('../../server/middleware/auth', () => (req, res, next) => {
  if (req.headers.authorization === `Bearer ${DUMMY_TOKEN}`) {
    req.user = { id: 'u1' };
    next();
  } else {
    res.status(401).send({ message: 'Unauthorized' });
  }
});

describe('API: /api/v1/groups/:groupId/expenses', () => {
  describe('POST /', () => {
    it('should reject structurally invalid payloads returning 400', async () => {
      const { status, body } = await request(app)
        .post(`/api/v1/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${DUMMY_TOKEN}`)
        .send({
           title: 'Dinner',
           totalAmountCents: 1000, 
           // Missing `splitType` and `splits`
        });

      expect(status).toBe(400);
      expect(body.message).toMatch(/Validation Error/);
    });

    it('should successfully parse valid exact arrays and commit', async () => {
      // Mock db returns representing group membership success
      db.query.mockResolvedValueOnce({ rowCount: 1 }); // User is in group check
      db.query.mockResolvedValueOnce({ rows: [{ id: 'exp1' }] }); // Insert expense

      const payload = {
        title: 'Uber Ride',
        totalAmountCents: 1550,
        paidByUserId: 'u1',
        date: '2026-03-31',
        splitType: 'exact',
        splits: [
           { userId: 'u1', value: 775 },
           { userId: 'u2', value: 775 }
        ]
      };

      const { status } = await request(app)
        .post(`/api/v1/groups/${groupId}/expenses`)
        .set('Authorization', `Bearer ${DUMMY_TOKEN}`)
        .send(payload);

      // Status 201 Created
      expect(status).toBe(201);
    });
  });

  describe('DELETE /:expenseId', () => {
    it('should delete existing expense returning 200 properly triggering cascade or soft-deletes natively', async () => {
      // Simulation of ownership/admin check passing natively 
      db.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ paid_by_user_id: 'u1' }] });

      const { status } = await request(app)
        .delete(`/api/v1/groups/${groupId}/expenses/exp1`)
        .set('Authorization', `Bearer ${DUMMY_TOKEN}`);
        
      expect(status).toBe(200);
    });
  });
});
