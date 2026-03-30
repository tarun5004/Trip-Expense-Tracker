/**
 * @module groups.test
 * @description Integration coverage emphasizing Authorization boundary testing evaluating standard membership scopes.
 */

const request = require('supertest');
const app = require('../../server/app');
const db = require('../../server/config/db');

const DUMMY_TOKEN = 'mock-jwt-u1';

jest.mock('../../server/middleware/auth', () => (req, res, next) => {
  if (req.headers.authorization === `Bearer ${DUMMY_TOKEN}`) {
    req.user = { id: 'u1' };
    next();
  } else {
    res.status(401).send();
  }
});

describe('API: /api/v1/groups', () => {
  describe('GET /:groupId', () => {
    it('should grant access and return group payload returning 200 if natively mapped via DB', async () => {
      // Mock isMember check returning true
      db.query.mockResolvedValueOnce({ rowCount: 1 });
      // Mock group data fetch
      db.query.mockResolvedValueOnce({ rows: [{ id: 'g1', name: 'Goa Trip' }] });

      const { status, body } = await request(app)
        .get('/api/v1/groups/g1')
        .set('Authorization', `Bearer ${DUMMY_TOKEN}`);

      expect(status).toBe(200);
      expect(body.data).toHaveProperty('name', 'Goa Trip');
    });

    it('should instantly block with 403 Forbidden if user requests data for Group they are not a member of natively', async () => {
      // Mock isMember check returning false (rowCount = 0)
      db.query.mockResolvedValueOnce({ rowCount: 0 });

      const { status } = await request(app)
        .get('/api/v1/groups/g2')
        .set('Authorization', `Bearer ${DUMMY_TOKEN}`);

      expect(status).toBe(403);
    });

    it('should gracefully return 404 if group completely fails finding UUID string matches globally', async () => {
       // Mock isMember query throws natively finding no group
       db.query.mockResolvedValueOnce({ rowCount: 1 }); // Bypass member check just to test 404
       db.query.mockResolvedValueOnce({ rows: [] }); // Group data empty

       const { status } = await request(app)
        .get('/api/v1/groups/invalid-group')
        .set('Authorization', `Bearer ${DUMMY_TOKEN}`);

       expect(status).toBe(404);
    });
  });
});
