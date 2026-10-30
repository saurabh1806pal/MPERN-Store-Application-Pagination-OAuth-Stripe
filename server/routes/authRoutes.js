import express from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { registerUser, verifyEmail, loginUser, getMe, logoutUser } from '../controllers/authController.js';
import passport from '../config/passport.js';
import { googleLoginCallback } from '../controllers/googleAuthController.js';


const router = express.Router();

router.post('/register', registerUser);
router.get('/verify-email', verifyEmail);
router.post('/login', loginUser);
router.get('/me', authenticateUser, getMe);
router.post('/logout', authenticateUser, logoutUser);

// Google OAuth routes

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
}));

router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/?error=Google authentication failed`,
    session: false,
}), googleLoginCallback
)

export default router;