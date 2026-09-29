import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { transferService } from '../services/transfer.service.js';
import { sendSuccess } from '../utils/response.js';

export class TransferController {
  async getTransfers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const facilityId = req.query.facilityId as string | undefined;
      const transfers = await transferService.getTransfers(facilityId, req.user!);
      sendSuccess(res, transfers, 'Transfers retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTransferById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const transfer = await transferService.getTransferById(id, req.user!);
      sendSuccess(res, transfer, 'Transfer details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTransferSources(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sources = await transferService.getTransferSources(req.user!);
      sendSuccess(res, sources, 'Eligible transfer sources retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const transfer = await transferService.createTransfer(req.body, req.user!);
      sendSuccess(res, transfer, 'Resource transfer request initiated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTransfer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await transferService.updateTransfer(id, req.body, req.user!);
      sendSuccess(res, updated, 'Transfer parameters updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await transferService.updateStatus(id, req.body, req.user!);
      sendSuccess(res, updated, 'Transfer status transitioned successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const transferController = new TransferController();
