import userModel from "../models/userModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Validate request body
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
                errors: {
                    name: !name ? "Name is required" : null,
                    email: !email ? "Email is required" : null,
                    password: !password ? "Password is required" : null
                }
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Invalid email format",
                errors: { email: "Please provide a valid email address" }
            });
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
                errors: { email: "This email is already registered" }
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new userModel({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET || 'default-secret-key',
            { expiresIn: "1h" }
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                name: newUser.name,
                email: newUser.email,
                credits: newUser.credits,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific errors
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Duplicate email",
                errors: { email: "This email is already registered" }
            });
        }

        res.status(500).json({
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};  
const loginUser = async (req, res) => {
    try {
        console.log('Login request received:', {
            email: req.body.email,  // Log email only for debugging
            timestamp: new Date().toISOString()
        });

        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            console.log('Login validation failed - missing fields');
            return res.status(400).json({
                message: "All fields are required",
                errors: {
                    email: !email ? "Email is required" : null,
                    password: !password ? "Password is required" : null
                }
            });
        }

        // Find user
        console.log('Searching for user with email:', email);
        const user = await userModel.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({
                message: "User not found",
                errors: { email: "No account found with this email" }
            });
        }

        console.log('User found, checking password');
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Password validation failed for user:', user.email);
            return res.status(400).json({
                message: "Invalid credentials",
                errors: { password: "Invalid password" }
            });
        }

        console.log('Password validation successful, generating token');
        // Generate token with 7 days expiration
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'default-secret-key', // Fallback to default if env variable not set
            { expiresIn: "7d" } // 7 days expiration
        );

        console.log('Login successful for user:', user.email);
        // Send response
        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            user: {
                name: user.name,
                email: user.email,
                credits: user.credits
            }
        });
    } catch (error) {
        console.error('Login error:', {
            error: error,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // Handle specific errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: "Invalid request",
                errors: error.errors
            });
        }

        res.status(500).json({
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

const userCredits = async (req, res) => {
    try {
        // User is already attached to the request by auth middleware
        const user = req.user;
        
        res.status(200).json({
            success: true,
            message: "User credits retrieved successfully",
            credits: user.credits,
            user: {
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Credits error:', error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

const logoutUser = async (req, res) => {
    try {
        // Get the token from Authorization header
        const authHeader = req.headers.authorization || req.headers.token;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
                error: "Please provide a valid JWT token in the Authorization header"
            });
        }

        // Extract the token from 'Bearer <token>'
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid token format",
                error: "Token should be in the format 'Bearer <token>'"
            });
        }

        // Add token to blacklist
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
        const expiresAt = new Date(decoded.exp * 1000); // Convert JWT exp to Date
        
        await TokenBlacklist.create({
            token,
            expiresAt
        });

        res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });
    } catch (error) {
        console.error('Logout error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Get current user profile
const getCurrentUser = async (req, res) => {
    try {
        // The user is already attached to the request by the auth middleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Return user data without sensitive information
        const userData = {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            credits: req.user.credits,
            createdAt: req.user.createdAt,
            updatedAt: req.user.updatedAt
        };

        res.status(200).json({
            success: true,
            user: userData
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving user profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export { registerUser, loginUser, userCredits, logoutUser, getCurrentUser };