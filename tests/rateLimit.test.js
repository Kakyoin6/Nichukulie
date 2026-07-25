const request = require('supertest');
const app = require('../server');

// The global rate limiters are skipped when NODE_ENV === 'test' (see
// tests/setup.js and middleware/rateLimiter.js) so the rest of the suite
// can make many rapid requests without tripping them. This file proves
// the limiter actually works by temporarily flipping NODE_ENV for the
// duration of a single test, then restoring it immediately after.
describe('Rate limiting (auth endpoints)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('blocks login attempts after exceeding the limit', async () => {
    process.env.NODE_ENV = 'production'; // re-enable the limiter for this test only

    const attempt = () =>
      request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong-password' });

    // authLimiter allows 10 requests per window — the 11th should be blocked.
    let lastStatus;
    for (let i = 0; i < 11; i++) {
      const res = await attempt();
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});
