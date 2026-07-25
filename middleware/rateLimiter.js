const rateLimit = require('express-rate-limit');

// In tests (tests/setup.js sets NODE_ENV=test), skip rate limiting
// entirely — the test suite makes many rapid requests by design, and
// rate-limit state is in-memory, so it would otherwise start returning
// 429s partway through the suite instead of the responses being tested.
const skipInTests = () => process.env.NODE_ENV === 'test';

// Strict limiter for auth endpoints — the highest-value target for
// brute-force password guessing and credential stuffing. 10 attempts
// per 15 minutes per IP is generous for a real user, painful for an
// automated attack.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
});

// Looser general-purpose limiter for the rest of the API — protects
// against basic scripted abuse without getting in the way of normal use.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
});

// M-Pesa STK push triggers a real prompt on a real phone and costs API
// call volume — needs its own tight limit independent of general API use.
const mpesaLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: 'Too many payment attempts. Please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
});

module.exports = { authLimiter, apiLimiter, mpesaLimiter };
