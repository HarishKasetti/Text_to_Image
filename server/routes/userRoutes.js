import express from 'express';
import { registerUser, loginUser, userCredits, logoutUser, getCurrentUser } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (require authentication)
router.use(authMiddleware);
router.get('/me', getCurrentUser);
router.get('/credits', userCredits);
router.post('/logout', logoutUser);

export default router;