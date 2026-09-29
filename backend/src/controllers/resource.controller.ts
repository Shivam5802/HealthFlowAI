import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { resourceService } from '../services/resource.service.js';
import { sendSuccess } from '../utils/response.js';

export class ResourceController {
  async getResources(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, search } = req.query as { category?: string; search?: string };
      const resources = await resourceService.getResources({ category, search });
      sendSuccess(res, resources, 'Resources catalog retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getResourceById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const resource = await resourceService.getResourceById(id);
      sendSuccess(res, resource, 'Resource retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createResource(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const resource = await resourceService.createResource(req.user!, req.body);
      sendSuccess(res, resource, 'Resource created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateResource(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await resourceService.updateResource(req.user!, id, req.body);
      sendSuccess(res, updated, 'Resource updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const resourceController = new ResourceController();
