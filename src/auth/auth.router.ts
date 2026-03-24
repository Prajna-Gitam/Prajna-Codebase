import { Router } from 'express';
import { requireAuth } from './auth.middleware.js';
import * as controller from './auth.controller.js';

const router = Router();

// Public endpoints
router.post('/login', controller.login);
router.post('/mfa/send-otp', controller.sendOtp);
router.post('/mfa/verify', controller.verifyOtp);
router.post('/refresh', controller.refresh);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Protected endpoints
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);
router.post('/change-password', requireAuth, controller.changePassword);

export default router;
