import express from 'express';
import { register, login, getMe, updateProfile, googleLogin, sendOtp, getAllUsers, updateUserRole } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/send-otp', sendOtp);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin routes
router.get('/admin/users', protect, adminOnly, getAllUsers);
router.put('/admin/users/:id/role', protect, adminOnly, updateUserRole);

export default router;
