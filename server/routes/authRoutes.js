import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { registerUser, verifyEmail, loginUser, getMe } from '../controllers/authController.js'; 

const router = express.Router();

router.get('/me', authenticateUser, getMe);
router.post('/register', registerUser);
router.get('/verify-email', verifyEmail);
router.post('/login', loginUser);

export default router;