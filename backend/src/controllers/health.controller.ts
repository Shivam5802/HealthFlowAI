import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response.js';

export class HealthController {
  check(_req: Request, res: Response): void {
    sendSuccess(
      res,
      {
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'healthflow-backend',
        version: '1.0.0',
      },
      'HealthFlow Backend API is healthy and operational'
    );
  }
}

export const healthController = new HealthController();
