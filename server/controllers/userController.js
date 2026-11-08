import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import TokenBlacklist from "../models/tokenBlacklist.js";

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({ success: false, message: "Name, email and password are required" });
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const existingUser = await userModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "This email is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await userModel.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                credits: newUser.credits,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "This email is already registered" });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const loginUser = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await userModel.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const userCredits = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "User credits retrieved successfully",
        credits: req.user.credits,
        user: { name: req.user.name, email: req.user.email }
    });
};

const logoutUser = async (req, res) => {
    try {
        await TokenBlacklist.updateOne(
            { token: req.token },
            { $setOnInsert: { token: req.token, expiresAt: req.tokenExpiresAt } },
            { upsert: true }
        );
        return res.status(200).json({ success: true, message: "User logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ success: false, message: "Could not log out" });
    }
};

const getCurrentUser = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            credits: req.user.credits,
            createdAt: req.user.createdAt,
            updatedAt: req.user.updatedAt
        }
    });
};

export { registerUser, loginUser, userCredits, logoutUser, getCurrentUser };
