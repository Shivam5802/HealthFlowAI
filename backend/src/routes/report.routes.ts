import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// Daily operational summary
router.get('/daily', (req, res, next) => reportController.getDailyReport(req, res, next));

// Weekly trend summary
router.get('/weekly', (req, res, next) => reportController.getWeeklyReport(req, res, next));

// Backward-compatible summary fallback
router.get('/summary', (req, res, next) => reportController.getDailyReport(req, res, next));

export default router;
