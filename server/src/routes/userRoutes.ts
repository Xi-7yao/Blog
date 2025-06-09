import express from 'express';
import {
  register,
  login,
  getUser,
  logout,
  refreshToken,
  updateUsername,
} from '../controllers/userController';

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/me').get(getUser);
router.route('/logout').post(logout);
router.route('/refresh').post(refreshToken);
router.route('/updateUsername').post(updateUsername);

export default router;