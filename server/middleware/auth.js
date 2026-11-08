import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import TokenBlacklist from '../models/tokenBlacklist.js';

const authMiddleware = async (req, res, next) => {
    try {
        const authorization = req.header('Authorization');
        const token = authorization?.startsWith('Bearer ')
            ? authorization.slice(7).trim()
            : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            const expired = error.name === 'TokenExpiredError';
            return res.status(401).json({
                success: false,
                message: expired ? 'Session expired. Please log in again.' : 'Invalid token',
                code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
            });
        }

        const revoked = await TokenBlacklist.exists({ token });
        if (revoked) {
            return res.status(401).json({
                success: false,
                message: 'This session has been logged out.',
                code: 'TOKEN_REVOKED'
            });
        }

        const user = await userModel.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        req.user = user;
        req.token = token;
        req.tokenExpiresAt = new Date(decoded.exp * 1000);
        next();
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication could not be completed'
        });
    }
};

export { authMiddleware };
