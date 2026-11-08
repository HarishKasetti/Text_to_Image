import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/mongodb.js";
import userRoutes from "./routes/userRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const PORT = process.env.PORT || 4000;
const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        const isLocalDevelopment = process.env.NODE_ENV !== "production"
            && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "");
        callback(null, !origin || allowedOrigins.includes(origin) || isLocalDevelopment);
    }
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
    res.status(200).json({ success: true, message: "Picturize API is running" });
});

app.use("/api/user", userRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/payment", paymentRoutes);

app.use((err, req, res, next) => {
    console.error("Unhandled API error:", err);
    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
});

const startServer = async () => {
    try {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
            throw new Error("JWT_SECRET must be configured with at least 32 characters");
        }
        await connectDB();
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Picturize API listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
};

startServer();
