import crypto from 'crypto';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';
import userModel from '../models/userModel.js';
import Payment from '../models/paymentModel.js';

const plans = {
    starter: { name: 'Starter', credits: 50, amount: 19900 },
    pro: { name: 'Pro', credits: 150, amount: 49900 },
    agency: { name: 'Agency', credits: 400, amount: 99900 }
};

const getRazorpay = () => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        const error = new Error('Razorpay is not configured on the server');
        error.statusCode = 503;
        throw error;
    }
    return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
};

const createOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        const plan = plans[planId];
        if (!plan) {
            return res.status(400).json({ success: false, message: 'Invalid plan selected' });
        }

        const razorpay = getRazorpay();
        const receipt = `pic_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const order = await razorpay.orders.create({
            amount: plan.amount,
            currency: 'INR',
            receipt,
            notes: {
                userId: String(req.user._id),
                planId,
                credits: String(plan.credits)
            }
        });

        await Payment.create({
            user: req.user._id,
            orderId: order.id,
            planId,
            amount: plan.amount,
            currency: 'INR',
            credits: plan.credits,
            status: 'created'
        });

        return res.status(201).json({
            success: true,
            order,
            key: process.env.RAZORPAY_KEY_ID,
            plan: { id: planId, name: plan.name, credits: plan.credits }
        });
    } catch (error) {
        console.error('Create payment order failed:', error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : 'Unable to create payment order'
        });
    }
};

const verifyPayment = async (req, res) => {
    const { orderId, paymentId, signature } = req.body || {};
    if (!orderId || !paymentId || !signature) {
        return res.status(400).json({ success: false, message: 'Missing payment verification details' });
    }

    const session = await mongoose.startSession();
    try {
        const razorpay = getRazorpay();
        const paymentRecord = await Payment.findOne({
            orderId,
            user: req.user._id
        });

        if (!paymentRecord) {
            return res.status(404).json({ success: false, message: 'Payment order not found' });
        }

        if (paymentRecord.status === 'credited') {
            const user = await userModel.findById(req.user._id).select('credits');
            return res.status(200).json({
                success: true,
                message: 'Payment was already processed',
                credits: user?.credits
            });
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const receivedBuffer = /^[a-f0-9]{64}$/i.test(signature)
            ? Buffer.from(signature, 'hex')
            : Buffer.alloc(0);

        if (expectedBuffer.length !== receivedBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        const [order, payment] = await Promise.all([
            razorpay.orders.fetch(orderId),
            razorpay.payments.fetch(paymentId)
        ]);

        const expectedPlan = plans[paymentRecord.planId];
        if (
            order.id !== paymentRecord.orderId ||
            order.amount !== paymentRecord.amount ||
            order.currency !== 'INR' ||
            order.notes?.userId !== String(req.user._id) ||
            order.notes?.planId !== paymentRecord.planId ||
            payment.order_id !== orderId ||
            payment.amount !== paymentRecord.amount ||
            payment.currency !== 'INR' ||
            payment.status !== 'captured' ||
            !expectedPlan
        ) {
            return res.status(400).json({
                success: false,
                message: 'Payment details do not match this order or payment is not captured'
            });
        }

        await session.withTransaction(async () => {
            const claimedPayment = await Payment.findOneAndUpdate(
                { _id: paymentRecord._id, status: 'created' },
                { $set: { status: 'credited', paymentId, verifiedAt: new Date() } },
                { new: true, session }
            );

            if (!claimedPayment) {
                const existing = await Payment.findById(paymentRecord._id).session(session);
                if (existing?.status !== 'credited' || existing.paymentId !== paymentId) {
                    throw new Error('Payment is already being processed or was processed with different details');
                }
                return;
            }

            const user = await userModel.findByIdAndUpdate(
                req.user._id,
                { $inc: { credits: paymentRecord.credits } },
                { new: true, session }
            ).select('credits');

            if (!user) throw new Error('User account was not found');
        });

        const updatedUser = await userModel.findById(req.user._id).select('credits');
        return res.status(200).json({
            success: true,
            message: 'Payment verified and credits added',
            credits: updatedUser.credits
        });
    } catch (error) {
        console.error('Verify payment failed:', error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : 'Unable to verify payment. Contact support if your payment was deducted.'
        });
    } finally {
        await session.endSession();
    }
};

export { createOrder, verifyPayment };
