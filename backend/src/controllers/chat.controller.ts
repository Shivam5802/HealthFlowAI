import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { chatService } from '../services/chat.service.js';
import { sendSuccess } from '../utils/response.js';

export class ChatController {
  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, history } = req.body;
      const response = await chatService.processQuery(message, history || [], req.user!);
      sendSuccess(res, response, 'HealthFlow Panda response generated');
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
