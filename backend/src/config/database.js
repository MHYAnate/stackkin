import mongoose from 'mongoose';
import logger from './logger.js';

const connectDatabase = async () => {
  try {
    const MONGODB_URI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Mongoose connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      w: 'majority'
    };

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, options);

    logger.info(`Connected to MongoDB: ${mongoose.connection.name}`);
    logger.info(`MongoDB Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

    // Event listeners for MongoDB connection
    mongoose.connection.on('connecting', () => {
      logger.info('Connecting to MongoDB...');
    });

    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// MongoDB health check
export const checkDatabaseHealth = async () => {
  try {
    // Check if we can run a simple command
    await mongoose.connection.db.admin().ping();
    return {
      status: 'healthy',
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      readyState: mongoose.connection.readyState
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      readyState: mongoose.connection.readyState
    };
  }
};

// Create indexes function
export const createIndexes = async () => {
  try {
    // Get all models
    const models = mongoose.modelNames();
    
    for (const modelName of models) {
      const model = mongoose.model(modelName);
      
      // Check if model has createIndexes method
      if (model.createIndexes) {
        await model.createIndexes();
        logger.info(`Created indexes for model: ${modelName}`);
      }
    }
    
    logger.info('All indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
    throw error;
  }
};

export default connectDatabase;