// ============================================================
// NICHUKULIE — Database Seed Script
// Run: npm run seed
// ============================================================

require('dotenv').config();

// Same fix as server.js — some Windows networks cause Node's internal
// DNS resolver to fail on mongodb+srv:// SRV lookups even though the
// OS resolver succeeds. This must be set in every entry-point file
// that connects to Mongo, not just server.js.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI. Set it in backend/.env before running npm run seed.');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');

  await User.deleteMany({});

  // Pass plaintext passwords and let the real User model's pre('save')
  // hook hash them — using create() (not insertMany()) so that hook
  // actually fires, keeping seeded users consistent with however
  // real registrations get hashed.
  const plainPassword = 'Password1!';

  await User.create([
    { firstName:'Admin', lastName:'Nichukulie', email:'admin@nichukulie.co.ke', phone:'0700000000', password: plainPassword, role:'admin' },
    { firstName:'Amara', lastName:'Ochieng', email:'amara@example.com', phone:'0712345678', password: plainPassword, role:'customer' },
    { firstName:'James', lastName:'Mwangi', email:'james@example.com', phone:'0722111222', password: plainPassword, role:'runner' },
    { firstName:'Aisha', lastName:'Kamau', email:'aisha@example.com', phone:'0733222333', password: plainPassword, role:'runner' },
    { firstName:'Brian', lastName:'Otieno', email:'brian@example.com', phone:'0744333444', password: plainPassword, role:'customer' },
  ]);

  console.log('✅ Seed complete. Default password for all: Password1!');
  console.log('   Admin: admin@nichukulie.co.ke');
  console.log('   User:  amara@example.com');
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });