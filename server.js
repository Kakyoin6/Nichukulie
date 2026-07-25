// ============================================================
// NICHUKULIE — Backend Server (Node.js + Express)
// ============================================================

require('dotenv').config();

// Fix: Node's internal DNS resolver fails mongodb+srv:// SRV lookups
// on some networks (common on Windows and certain cloud providers).
// Pointing at public DNS servers works around this reliably.
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

// Render assigns PORT automatically — fallback to 5000 for local dev
const PORT = process.env.PORT || 5000;

// ── CORS ────────────────────────────────────────────────────
// In production both frontend and backend are on the same origin
// (Express serves index.html). In dev, allow localhost ports.
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  `http://localhost:${PORT}`,
  `http://localhost:5000`,
  `http://127.0.0.1:${PORT}`,
  `http://127.0.0.1:5000`,
  'http://localhost:5500',   // VS Code Live Server (dev only)
  'http://127.0.0.1:5500',
  'null',
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    console.warn(`CORS blocked: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
}));

// ── SECURITY & MIDDLEWARE ───────────────────────────────────
// Disable only contentSecurityPolicy — it blocks the inline <script>
// in index.html. All other helmet protections remain active.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

// ── STATIC FRONTEND ─────────────────────────────────────────
// Render root directory is set to "backend/" so __dirname is the
// backend folder. frontend/ sits one level up at the repo root.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API ROUTES ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/errands', errandRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/admin', adminRoutes);

// ── HEALTH CHECK ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'Nichukulie API',
  env: process.env.NODE_ENV || 'development',
  time: new Date().toISOString(),
}));

// ── SPA FALLBACK ─────────────────────────────────────────────
// Any non-API route that doesn't match a static file serves
// index.html — this means /health and direct URL navigation works.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ── 404 + ERROR HANDLER ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── START ────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`   Nichukulie API running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Frontend: ${path.join(__dirname, '..', 'frontend')}`);
    setTimeout(connectMongo, 0);
  });
}

module.exports = app;
