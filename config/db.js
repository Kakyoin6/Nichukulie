
const mongoose = require('mongoose');

function connectMongo() {
  if (!process.env.MONGO_URI) {
    console.warn('MongoDB not connected: set MONGO_URI in .env to enable database features.');
    return;
  }
  mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err.message));
}

module.exports = connectMongo;
