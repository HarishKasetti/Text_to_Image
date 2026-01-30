import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/mongodb.js";
import userRoutes from "./routes/userRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userModel from "./models/userModel.js";
const PORT=process.env.PORT || 4000;
const app=express();

// Middleware
app.use(express.json());
app.use(cors());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Routes
app.get('/', (req, res) => {
    res.send("API Working");
});

app.use('/api/user', userRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/payment', paymentRoutes);

// Start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

startServer();
