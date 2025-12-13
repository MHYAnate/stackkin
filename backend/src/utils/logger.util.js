// src/utils/logger.util.js
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format
 */
const logFormat = printf(({ level, message, timestamp, context, ...meta }) => {
  const ctx = context ? `[${context}]` : '';
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} ${level} ${ctx}: ${message} ${metaStr}`.trim();
});

/**
 * Create logger instance
 * @param {string} context - Logger context/module name
 * @returns {winston.Logger}
 */
export const createLogger = (context = 'App') => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
    defaultMeta: { context },
    transports: [
      new winston.transports.Console({
        format: combine(
          colorize({ all: true }),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          logFormat
        ),
      }),
    ],
  });
};

/**
 * Default logger instance
 */
export const logger = createLogger();

export default logger;