import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { userService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';

export class UserController {
  async createEmployee(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.createEmployee(req.user!, req.body);
      sendSuccess(res, user, 'Employee account provisioned successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAllUsers(req.user!);
      sendSuccess(res, users, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await userService.getUserById(id, req.user!);
      sendSuccess(res, user, 'User details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await userService.updateUser(id, req.body, req.user!);
      sendSuccess(res, updated, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await userService.updateUserStatus(id, req.body.status, req.user!);
      sendSuccess(res, updated, 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
