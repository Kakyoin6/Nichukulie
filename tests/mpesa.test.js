const request = require('supertest');

// Mock axios BEFORE requiring the app, since utils/mpesa.js and the controller
// both call axios under the hood — we don't want real network calls to
// Safaricom's sandbox in tests/CI.
jest.mock('axios');
const axios = require('axios');

const app = require('../server');

async function registerAndLogin() {
  const user = {
    firstName: 'Pay',
    lastName: 'Er',
    email: `payer${Date.now()}${Math.random()}@example.com`,
    phone: '0712345678',
    password: 'Password1!',
  };
  const res = await request(app).post('/api/auth/register').send(user);
  return res.body.token;
}

describe('M-Pesa routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/mpesa/stkpush', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await request(app).post('/api/mpesa/stkpush').send({ phone: '0712345678', amount: 100 });
      expect(res.status).toBe(401);
    });

    it('rejects requests missing phone or amount', async () => {
      const token = await registerAndLogin();
      const res = await request(app)
        .post('/api/mpesa/stkpush')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '0712345678' }); // missing amount

      expect(res.status).toBe(400);
    });

    it('initiates an STK push and stores a pending payment', async () => {
      const token = await registerAndLogin();

      // First call = OAuth token request, second call = STK push request
      axios.get.mockResolvedValueOnce({ data: { access_token: 'fake-token' } });
      axios.post.mockResolvedValueOnce({ data: { CheckoutRequestID: 'ws_CO_test123' } });

      const res = await request(app)
        .post('/api/mpesa/stkpush')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '0712345678', amount: 350 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.checkoutId).toBe('ws_CO_test123');
    });

    it('returns 500 if the Daraja API call fails', async () => {
      const token = await registerAndLogin();
      axios.get.mockRejectedValueOnce(new Error('Network error'));

      const res = await request(app)
        .post('/api/mpesa/stkpush')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '0712345678', amount: 350 });

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/mpesa/callback', () => {
    it('rejects a malformed callback body', async () => {
      const res = await request(app).post('/api/mpesa/callback').send({ not: 'valid' });
      expect(res.status).toBe(400);
    });

    it('marks a payment completed on successful callback', async () => {
      const token = await registerAndLogin();
      axios.get.mockResolvedValueOnce({ data: { access_token: 'fake-token' } });
      axios.post.mockResolvedValueOnce({ data: { CheckoutRequestID: 'ws_CO_cb_test' } });

      await request(app)
        .post('/api/mpesa/stkpush')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '0712345678', amount: 200 });

      const callbackPayload = {
        Body: {
          stkCallback: {
            CheckoutRequestID: 'ws_CO_cb_test',
            ResultCode: 0,
            CallbackMetadata: {
              Item: [{ Name: 'MpesaReceiptNumber', Value: 'QGH7XJ9K2L' }],
            },
          },
        },
      };

      const res = await request(app).post('/api/mpesa/callback').send(callbackPayload);
      expect(res.status).toBe(200);

      const status = await request(app)
        .get('/api/mpesa/status/ws_CO_cb_test')
        .set('Authorization', `Bearer ${token}`);
      expect(status.body.status).toBe('completed');
      expect(status.body.mpesaRef).toBe('QGH7XJ9K2L');
    });

    it('marks a payment failed when ResultCode is non-zero', async () => {
      const token = await registerAndLogin();
      axios.get.mockResolvedValueOnce({ data: { access_token: 'fake-token' } });
      axios.post.mockResolvedValueOnce({ data: { CheckoutRequestID: 'ws_CO_fail_test' } });

      await request(app)
        .post('/api/mpesa/stkpush')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '0712345678', amount: 200 });

      await request(app).post('/api/mpesa/callback').send({
        Body: { stkCallback: { CheckoutRequestID: 'ws_CO_fail_test', ResultCode: 1032 } },
      });

      const status = await request(app)
        .get('/api/mpesa/status/ws_CO_fail_test')
        .set('Authorization', `Bearer ${token}`);
      expect(status.body.status).toBe('failed');
    });
  });
});
