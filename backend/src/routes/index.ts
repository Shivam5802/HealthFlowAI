import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import facilityRoutes from './facility.routes.js';
import resourceRoutes from './resource.routes.js';
import inventoryRoutes from './inventory.routes.js';
import patientRoutes from './patient.routes.js';
import predictionRoutes from './prediction.routes.js';
import riskRoutes from './risk.routes.js';
import alertRoutes from './alert.routes.js';
import transferRoutes from './transfer.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import reportRoutes from './report.routes.js';
import chatRoutes from './chat.routes.js';
import auditRoutes from './audit.routes.js';
import healthRoutes from './health.routes.js';
import docsRoutes from './docs.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/facilities', facilityRoutes);
router.use('/resources', resourceRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/patients', patientRoutes);
router.use('/predictions', predictionRoutes);
router.use('/risks', riskRoutes);
router.use('/alerts', alertRoutes);
router.use('/transfers', transferRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/reports', reportRoutes);
router.use('/chat', chatRoutes);
router.use('/audit', auditRoutes);
router.use('/health', healthRoutes);
router.use('/docs', docsRoutes);

export default router;
