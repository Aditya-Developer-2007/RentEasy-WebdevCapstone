const mongoose = require('mongoose');

/**
 * Connect to MongoDB using MONGO_URI and register graceful shutdown handlers.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('[DB] MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Connection error: ${error.message}`);
    process.exit(1);
  }

  const gracefulShutdown = async (signal) => {
    try {
      await mongoose.connection.close();
      console.log(`[DB] MongoDB connection closed due to ${signal}.`);
      process.exit(0);
    } catch (err) {
      console.error(`[DB] Error during graceful shutdown: ${err.message}`);
      process.exit(1);
    }
  };

  process.once('SIGINT', () => gracefulShutdown('SIGINT'));
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

module.exports = connectDB;
