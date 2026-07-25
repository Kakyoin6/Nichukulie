const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Set env vars BEFORE any app code is required, so server.js / controllers
// pick these up instead of needing a real .env file in CI.
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';
process.env.MPESA_ENV = 'sandbox';
process.env.MPESA_SHORTCODE = '174379';
process.env.MPESA_PASSKEY = 'test-passkey';
process.env.MPESA_CONSUMER_KEY = 'test-key';
process.env.MPESA_CONSUMER_SECRET = 'test-secret';
process.env.BACKEND_URL = 'http://localhost:5000';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clean all collections between tests so they don't bleed into each other
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
