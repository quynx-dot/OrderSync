import mongoose from 'mongoose';
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: { level: (label) => ({ level: label }) },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const connectDB = async (uri: string, dbName: string) => {
  const options = {
    dbName,
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  };

  const connect = async () => {
    try {
      await mongoose.connect(uri, options);
      logger.info(`Successfully connected to database: ${dbName}`);
    } catch (error) {
      // FIX: Cast error to string for pino, or pass as an object
      logger.error({ error }, 'Database connection failed, retrying in 5s...');
      setTimeout(connect, 5000);
    }
  };

  // FIX: Explicitly type 'err' as 'any' to satisfy strict mode
  mongoose.connection.on('error', (err: any) => logger.error({ err }, 'MongoDB error'));
  
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected! Retrying...');
    connect();
  });

  await connect();
};