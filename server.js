// ============================================================
// NICHUKULIE — Backend Server (Node.js + Express)
// ============================================================

require('dotenv').config();

// Some Windows networks cause Node's internal DNS resolver (c-ares) to
// fail on mongodb+srv:// SRV lookups, even though the OS resolver (and
// tools like nslookup) succeed. Pointing Node at public DNS servers
// directly works around this — see: https://www.mongodb.com/community/forums/t/dns-operation-failed-error-querysrv-querytxt/12704
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

// ── MIDDLEWARE ──────────────────────────────────────────────
// Origins allowed to call this API. Includes common local dev setups:
// the backend serving its own frontend (5000), and VS Code's Live
// Server extension, which defaults to port 5500.
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'null',
].filter(Boolean));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    console.warn(`CORS blocked request from origin: ${origin}`);
    return callback(null, false);
  },
}));
app.use(helmet());
app.use(express.json({ limit: '100kb' })); // small, deliberate cap — this API has no legitimate need for large payloads
app.use(morgan('dev'));
app.use('/api', apiLimiter);
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── ROUTES ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/errands', errandRoutes);
app.use('/api/mpesa', mpesaRoutes);
app.use('/api/admin', adminRoutes);

// ── HEALTH CHECK ────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'Nichukulie API', time: new Date() }));

// ── 404 + ERROR HANDLER ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── START ───────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Nichukulie API running on port ${PORT}`);
    setTimeout(connectMongo, 0);
  });
}

module.exports = app;
