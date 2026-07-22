import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import {
  authRateLimiter,
  loginRateLimiter,
  forgotPasswordRateLimiter,
} from '../../middleware/rate-limit';

const router = Router();

router.use(authRateLimiter);

router.post('/login', loginRateLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', forgotPasswordRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authenticate, AuthController.me);

export default router;
