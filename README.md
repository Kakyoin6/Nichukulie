# Nichukulie 

A full-stack errand-running and logistics platform built for Nairobi. Customers book errands, pay via M-Pesa, and track deliveries in real time. Admins manage runners, orders, and payments through a live dashboard.

> *Nichukulie* means "let me carry it for you" in Swahili.

---

## Features

- **Errand booking** — shopping, pharmacy pickups, document collection, package delivery
- **M-Pesa payments** — STK Push integration via Safaricom Daraja API
- **Real-time map** — Leaflet + OpenStreetMap, route preview with live distance and ETA
- **Role-based access** — customers, runners, and admins with separate dashboards
- **Order tracking** — public tracking by order ID, no login required
- **Admin dashboard** — live stats, runner management, customer oversight, revenue tracking
- **JWT authentication** — secure, stateless auth with per-request token validation
- **Security hardening** — rate limiting, HTTP security headers, input validation

---

## Tech stack

**Backend**
- Node.js + Express
- MongoDB (Mongoose)
- JSON Web Tokens
- Safaricom Daraja API (M-Pesa)
- Jest + Supertest (test suite)
- GitHub Actions (CI)

**Frontend**
- Vanilla JS, HTML, CSS
- Leaflet + OpenStreetMap (maps)
- OSRM (routing)

---

## Project structure

```
backend/
├── config/          # Database connection
├── controllers/     # Route logic
├── middleware/      # Auth, rate limiting, error handling
├── models/          # Mongoose schemas
├── routes/          # API route definitions
├── utils/           # Shared helpers
└── tests/           # Jest + Supertest test suite

frontend/
└── index.html       # Single-page application
```

---

## Getting started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Safaricom Daraja developer account (for M-Pesa, optional for local dev)

### Installation

```bash
git clone https://github.com/your-username/nichukulie.git
cd nichukulie/backend
npm install
cp .env.example .env
# Fill in your environment variables
npm run seed    # Create demo accounts
npm run dev     # Start on http://localhost:5000
```

### Running tests

```bash
npm test
```

The test suite runs against an in-memory MongoDB instance — no real database or API keys needed.

---

## API overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Sign in, returns JWT |
| GET | `/api/auth/me` | ✅ | Current user profile |
| POST | `/api/errands` | ✅ | Book an errand |
| GET | `/api/errands/my` | ✅ | My errands |
| GET | `/api/errands/track/:id` | — | Public order tracking |
| POST | `/api/mpesa/stkpush` | ✅ | Initiate M-Pesa payment |
| GET | `/api/admin/stats` | ✅ Admin | Dashboard stats |

Full API documentation available in the [private docs](./docs/).

---

## Environment variables

See `.env.example` for the full list of required variables. Never commit your `.env` file.

---

## License

MIT
