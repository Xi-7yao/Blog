import express from 'express';
import {
  register,
  login,
  getUser,
  logout,
  refreshToken,
  updateUsername,
} from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { authRateLimiter, writeRateLimiter } from '../middleware/rateLimit';

const router = express.Router();

router.route('/register').post(authRateLimiter, register);
router.route('/login').post(authRateLimiter, login);
router.route('/me').get(authMiddleware, getUser);
router.route('/logout').post(authMiddleware, logout);
router.route('/refresh').post(authRateLimiter, refreshToken);
router.route('/updateUsername').post(authMiddleware, writeRateLimiter, updateUsername);

export default router;
