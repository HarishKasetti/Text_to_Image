import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Protected routes (require authentication)
router.use(authMiddleware);

// Create Razorpay order
router.post('/create-order', createOrder);

// Verify payment and update credits
router.post('/verify-payment', verifyPayment);

export default router;
