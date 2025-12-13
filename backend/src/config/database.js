// src/config/database.js
import mongoose from 'mongoose';
import { createLogger } from '../utils/logger.util.js';

const logger = createLogger('Database');

/**
 * MongoDB connection options
 */
const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4
  retryWrites: true,
  w: 'majority',
};

/**
 * Database connection state
 */
let isConnected = false;

/**
 * Connect to MongoDB
 * @returns {Promise<typeof mongoose>}
 */
export const connectDatabase = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return mongoose;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  try {
    // Set mongoose configurations
    mongoose.set('strictQuery', true);

    // Connect to MongoDB
    const connection = await mongoose.connect(mongoUri, connectionOptions);

    isConnected = true;
    logger.info(`MongoDB connected: ${connection.connection.host}`);

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
      isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed due to app termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed due to SIGTERM');
      process.exit(0);
    });

    return connection;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
export const disconnectDatabase = async () => {
  if (!isConnected) {
    logger.info('No active database connection to disconnect');
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

/**
 * Check database connection status
 * @returns {boolean}
 */
export const isDatabaseConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

/**
 * Get database connection instance
 * @returns {mongoose.Connection}
 */
export const getConnection = () => {
  return mongoose.connection;
};

/**
 * Database health check
 * @returns {Promise<Object>}
 */
export const checkDatabaseHealth = async () => {
  try {
    if (!isConnected) {
      return {
        status: 'disconnected',
        healthy: false,
        message: 'Database is not connected',
      };
    }

    // Ping the database
    await mongoose.connection.db.admin().ping();

    return {
      status: 'connected',
      healthy: true,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      readyState: mongoose.connection.readyState,
    };
  } catch (error) {
    return {
      status: 'error',
      healthy: false,
      message: error.message,
    };
  }
};

/**
 * Database configuration object
 */
export const databaseConfig = {
  uri: process.env.MONGODB_URI,
  options: connectionOptions,
  connect: connectDatabase,
  disconnect: disconnectDatabase,
  isConnected: isDatabaseConnected,
  getConnection,
  healthCheck: checkDatabaseHealth,
};

export default databaseConfig;