import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

const authMiddleware = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token, authorization denied' 
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
            console.log('Decoded token:', decoded);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Session expired. Please log in again.',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }
        
        // Find user by id from token
        const user = await userModel.findById(decoded.id).select('-password');
        
        if (!user) {
            console.log('User not found for ID:', decoded.id);
            return res.status(401).json({ 
                success: false, 
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // Attach user to request object
        req.user = user;
        console.log('User authenticated:', { userId: user._id, email: user.email });
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false, 
            message: 'Token is not valid',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export { authMiddleware };
