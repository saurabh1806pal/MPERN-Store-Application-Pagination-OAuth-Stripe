import express from 'express';
import { registerUser, verifyEmail } from '../controllers/authController.js'; 

const router = express.Router();

router.post('/register', registerUser);
router.get('/verify-email', verifyEmail);

export default router;