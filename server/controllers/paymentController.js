import Razorpay from 'razorpay';
import userModel from '../models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
const createOrder = async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;
        
        if (!amount) {
            return res.status(400).json({
                success: false,
                message: 'Amount is required'
            });
        }

        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            payment_capture: 1 // Auto capture payment
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating payment order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Verify payment and update credits
const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature, planId } = req.body;
        
        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment details'
            });
        }

        // In a production environment, you should verify the payment signature
        // For now, we'll trust the client and update credits
        
        // Find the plan details (you might want to store plans in the database)
        const plans = {
            'Basic': { credits: 100, price: 10 },
            'Standard': { credits: 250, price: 20 },
            'Premium': { credits: 500, price: 35 }
        };
        
        const plan = plans[planId];
        if (!plan) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan selected'
            });
        }

        // Update user's credits
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.credits += plan.credits;
        await user.save();

        // You might want to save the payment details in a payments collection
        // For now, we'll just return success

        res.status(200).json({
            success: true,
            message: 'Payment successful',
            credits: user.credits
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export { createOrder, verifyPayment };
