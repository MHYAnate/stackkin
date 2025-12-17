import express from 'express';
import webhookRoutes from './webhook.routes.js';
import uploadRoutes from './upload.routes.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import adRoutes from './ad.routes.js'; // New import

const router = express.Router();

router.use('/webhooks', webhookRoutes);
router.use('/upload', uploadRoutes);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/ads', adRoutes); // New route

export default router;