// ============================================================
// NICHUKULIE — Backend Server (Node.js + Express)
// ============================================================

require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const connectMongo = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const errandRoutes = require('./routes/errandRoutes');
const mpesaRoutes = require('./routes/mpesaRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const PORT = process.env.PORT || 5000;


// ── CORS ────────────────────────────────────────────────────

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  `http://localhost:${PORT}`,
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'null'
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));


// ── SECURITY & MIDDLEWARE ───────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(express.json({ limit: '100kb' }));

app.use(
  morgan(
    process.env.NODE_ENV === 'production'
      ? 'combined'
      : 'dev'
  )
);

app.use('/api', apiLimiter);


// ── API ROUTES ──────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/errands', errandRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/admin', adminRoutes);


// ── FRONTEND SERVING ────────────────────────────────────────

const frontendPath = path.join(__dirname, 'frontend');

console.log(`Frontend path: ${frontendPath}`);

app.use(express.static(frontendPath));


// ── HEALTH CHECK ────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Nichukulie API',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});


// ── FRONTEND FALLBACK ───────────────────────────────────────

app.get('*', (req, res, next) => {

  if (req.path.startsWith('/api')) {
    return next();
  }

  res.sendFile(
    path.join(frontendPath, 'index.html'),
    (err) => {
      if (err) {
        next(err);
      }
    }
  );
});


// ── ERROR HANDLING ──────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);


// ── START SERVER ────────────────────────────────────────────

if (require.main === module) {

  app.listen(PORT, () => {

    console.log(`Nichukulie API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend: ${frontendPath}`);

    setTimeout(connectMongo, 0);

  });

}


module.exports = app;
