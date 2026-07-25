const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

async function registerAndLogin(overrides = {}) {
  const user = {
    firstName: 'Test',
    lastName: 'User',
    email: `admin${Date.now()}${Math.random()}@example.com`,
    phone: '0712345678',
    password: 'Password1!',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(user);
  return { token: res.body.token, user: res.body.user };
}

async function makeAdmin(email) {
  return User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
}

describe('Admin routes', () => {
  it('blocks non-admins from all admin routes', async () => {
    const { token } = await registerAndLogin();
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns dashboard stats for an admin', async () => {
    const { token, user } = await registerAndLogin();
    await makeAdmin(user.email);

    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalErrands');
    expect(res.body).toHaveProperty('activeRunners');
    expect(res.body).toHaveProperty('totalRevenue');
    expect(res.body).toHaveProperty('pendingErrands');
  });

  it('lists only customers (not runners/admins) in /api/admin/users', async () => {
    const { token, user } = await registerAndLogin();
    await makeAdmin(user.email);
    await registerAndLogin(); // another plain customer

    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.every(u => u.role === 'customer')).toBe(true);
    expect(res.body.every(u => u.password === undefined)).toBe(true);
  });

  it('can suspend a user via PATCH /api/admin/users/:id/status', async () => {
    const { token, user } = await registerAndLogin();
    await makeAdmin(user.email);
    const { user: customer } = await registerAndLogin();

    const res = await request(app)
      .patch(`/api/admin/users/${customer.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);

    // Suspended user should now be blocked from logging in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: customer.email, password: 'Password1!' });
    expect(loginRes.status).toBe(403);
  });
});
