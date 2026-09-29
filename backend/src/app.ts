import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sendError, sendSuccess } from './utils/response.js';
import routes from './routes/index.js';

export const createApp = (): Express => {
  const app = express();

  // Security headers & Cross-Origin settings
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Health / Root info
  app.get('/', (_req: Request, res: Response) => {
    sendSuccess(
      res,
      {
        service: 'HEALTHFLOW AI Backend API',
        tagline: 'Predict. Prevent. Protect.',
        version: '1.0.0',
        environment: config.env,
        docs: '/api/health',
      },
      'Welcome to HealthFlow AI API Gateway'
    );
  });

  // Mount API Router
  app.use('/api', routes);

  // 404 Route Handler
  app.use((req: Request, res: Response) => {
    sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND', 404);
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
