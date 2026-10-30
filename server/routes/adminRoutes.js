import express from 'express';

import { getAllUsers } from '../controllers/adminController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = express.Router();

// Only ADMIN can view all the users

router.get("/users", authenticateUser, authorizeRole("ADMIN"), getAllUsers)

export default router;