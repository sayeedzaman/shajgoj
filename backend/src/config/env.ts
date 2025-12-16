import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

export const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const env = {
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  DATABASE_URL: getEnvVar('DATABASE_URL'),
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export const JWT_SECRET = env.JWT_SECRET;
export const DATABASE_URL = env.DATABASE_URL;
export const PORT = env.PORT;
export const NODE_ENV = env.NODE_ENV;