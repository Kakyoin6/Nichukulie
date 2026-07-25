const Errand = require('../models/Errand');
const Payment = require('../models/Payment');
const { getMpesaToken } = require('../utils/mpesa');

// POST /api/mpesa/stkpush
exports.stkPush = async (req, res) => {
  const { phone, amount, errandId } = req.body;
  if (!phone || !amount) return res.status(400).json({ message: 'Phone and amount required' });

  // Format phone: 0712345678 → 254712345678
  const formattedPhone = phone.replace(/^0/, '254');
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  try {
    const axios = require('axios');
    const token = await getMpesaToken();
    const stkUrl = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const { data } = await axios.post(stkUrl, {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.BACKEND_URL}/api/mpesa/callback`,
      AccountReference: 'Nichukulie',
      TransactionDesc: `Errand payment${errandId ? ' ' + errandId : ''}`,
    }, { headers: { Authorization: `Bearer ${token}` } });

    const payment = await Payment.create({
      errand: errandId || null,
      user: req.user._id,
      amount,
      phone: formattedPhone,
      checkoutId: data.CheckoutRequestID,
      status: 'processing',
    });

    res.json({
      success: true,
      checkoutId: data.CheckoutRequestID,
      paymentId: payment._id,
      message: 'STK Push sent. Enter M-Pesa PIN on your phone.',
    });
  } catch (err) {
    console.error('M-Pesa STK error:', err.response?.data || err.message);
    res.status(500).json({ message: 'M-Pesa request failed', error: err.response?.data });
  }
};

// POST /api/mpesa/callback — Safaricom calls this URL
exports.handleCallback = async (req, res) => {
  const callback = req.body.Body?.stkCallback;
  if (!callback) return res.status(400).json({ message: 'Invalid callback' });

  const checkoutId = callback.CheckoutRequestID;
  const resultCode = callback.ResultCode;

  try {
    // SECURITY NOTE: Safaricom's STK callback isn't cryptographically
    // signed, so this endpoint can't verify the request truly originated
    // from Safaricom the way e.g. Stripe webhook signatures can. The
    // mitigation here is to only ever transition a payment OUT OF a
    // pending/processing state — a forged callback referencing a
    // checkoutId that's already completed, failed, or doesn't exist
    // cannot do anything. In production, additionally restrict this
    // route to Safaricom's published callback IP ranges at the
    // network/firewall level for defense in depth.
    const existing = await Payment.findOne({ checkoutId });
    if (!existing || !['pending', 'processing'].includes(existing.status)) {
      console.warn(`M-Pesa callback ignored: no matching pending payment for checkoutId ${checkoutId}`);
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' }); // ack so Safaricom doesn't retry, but no state change
    }

    if (resultCode === 0) {
      const metadata = callback.CallbackMetadata?.Item;
      const mpesaRef = metadata?.find(i => i.Name === 'MpesaReceiptNumber')?.Value;

      await Payment.findOneAndUpdate(
        { checkoutId, status: { $in: ['pending', 'processing'] } },
        { status: 'completed', mpesaRef }
      );

      if (existing.errand) {
        await Errand.findByIdAndUpdate(existing.errand, {
          'payment.status': 'completed',
          'payment.mpesaRef': mpesaRef,
          status: 'pending', // ready for runner assignment
        });
      }
    } else {
      await Payment.findOneAndUpdate(
        { checkoutId, status: { $in: ['pending', 'processing'] } },
        { status: 'failed' }
      );
    }
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).json({ message: 'Callback processing error' });
  }
};

// GET /api/mpesa/status/:checkoutId
exports.getPaymentStatus = async (req, res) => {
  const payment = await Payment.findOne({ checkoutId: req.params.checkoutId });
  if (!payment) return res.status(404).json({ message: 'Payment not found' });
  res.json({ status: payment.status, mpesaRef: payment.mpesaRef });
};
