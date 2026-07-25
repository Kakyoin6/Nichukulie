const request = require('supertest');
const app = require('../server');

async function registerAndLogin(overrides = {}) {
  const user = {
    firstName: 'Test',
    lastName: 'User',
    email: `user${Date.now()}${Math.random()}@example.com`,
    phone: '0712345678',
    password: 'Password1!',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.token, user: res.body.user };
}

// Admin role can't be set via public register (good — that's a security feature,
// not a bug) so we promote a user directly via the model for admin-route tests.
const User = require('../models/User');
async function makeAdmin(email) {
  return User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
}

const sampleErrand = {
  type: 'shopping',
  pickup: 'Westgate Mall',
  delivery: 'Kilimani',
  scheduledDate: new Date(Date.now() + 86400000).toISOString(),
  price: { total: 350 },
};

describe('Errand routes', () => {
  describe('POST /api/errands', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await request(app).post('/api/errands').send(sampleErrand);
      expect(res.status).toBe(401);
    });

    it('creates an errand for an authenticated customer', async () => {
      const { token } = await registerAndLogin();
      const res = await request(app)
        .post('/api/errands')
        .set('Authorization', `Bearer ${token}`)
        .send(sampleErrand);

      expect(res.status).toBe(201);
      expect(res.body.orderId).toMatch(/^NCK-/);
      expect(res.body.status).toBe('pending');
    });

    it('rejects an errand missing required fields', async () => {
      const { token } = await registerAndLogin();
      const res = await request(app)
        .post('/api/errands')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'shopping' }); // missing pickup, delivery, etc.

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/errands/my', () => {
    it('only returns the requesting user\'s own errands', async () => {
      const customerA = await registerAndLogin();
      const customerB = await registerAndLogin();

      await request(app).post('/api/errands').set('Authorization', `Bearer ${customerA.token}`).send(sampleErrand);
      await request(app).post('/api/errands').set('Authorization', `Bearer ${customerB.token}`).send(sampleErrand);

      const res = await request(app)
        .get('/api/errands/my')
        .set('Authorization', `Bearer ${customerA.token}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });
  });

  describe('GET /api/errands/track/:orderId', () => {
    it('allows public tracking by orderId without auth', async () => {
      const { token } = await registerAndLogin();
      const created = await request(app)
        .post('/api/errands')
        .set('Authorization', `Bearer ${token}`)
        .send(sampleErrand);

      const res = await request(app).get(`/api/errands/track/${created.body.orderId}`);
      expect(res.status).toBe(200);
      expect(res.body.orderId).toBe(created.body.orderId);
    });

    it('returns 404 for unknown orderId', async () => {
      const res = await request(app).get('/api/errands/track/NCK-NOTFOUND');
      expect(res.status).toBe(404);
    });
  });

  describe('Admin-only access boundary', () => {
    it('blocks a regular customer from GET /api/errands (admin list)', async () => {
      const { token } = await registerAndLogin();
      const res = await request(app)
        .get('/api/errands')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('allows an admin to list all errands', async () => {
      const { token, user } = await registerAndLogin();
      await makeAdmin(user.email);
      // re-login to ensure token reflects updated state in /me, though role check
      // reads fresh from DB via `protect` middleware so original token still works
      const res = await request(app)
        .get('/api/errands')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.errands)).toBe(true);
    });

    it('blocks a regular customer from PATCH /api/errands/:id', async () => {
      const { token } = await registerAndLogin();
      const created = await request(app)
        .post('/api/errands')
        .set('Authorization', `Bearer ${token}`)
        .send(sampleErrand);

      const res = await request(app)
        .patch(`/api/errands/${created.body._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(403);
    });
  });
});
