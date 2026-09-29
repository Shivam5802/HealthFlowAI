import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config();

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  databaseUrl: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  corsOrigin: string;
  mlServiceUrl: string;
  geminiApiKey: string;
}

export const config: AppConfig = {
  env: (process.env.NODE_ENV as AppConfig['env']) || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://healthflow_user:healthflow_pass@localhost:5432/healthflow_db?schema=public',
  jwt: {
    secret: process.env.JWT_SECRET || 'healthflow_dev_secret_change_in_production_key_123',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
