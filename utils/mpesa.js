const axios = require('axios');

// Get M-Pesa OAuth access token from Safaricom Daraja API
async function getMpesaToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const url = process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const { data } = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return data.access_token;
}

module.exports = { getMpesaToken };
