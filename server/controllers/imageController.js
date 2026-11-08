import axios from "axios";
import userModel from "../models/userModel.js";

const generateImage = async (req, res) => {
    try {
        const prompt = req.body.prompt?.trim();
        if (!prompt) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }
        if (prompt.length > 1000) {
            return res.status(400).json({ success: false, message: "Prompt must be 1000 characters or fewer" });
        }
        if (!process.env.CLIPDROP_API) {
            console.error("CLIPDROP_API is not configured");
            return res.status(503).json({ success: false, message: "Image generation is temporarily unavailable" });
        }

        const imageResponse = await axios.post(
            "https://clipdrop-api.co/text-to-image/v1",
            { prompt },
            {
                headers: {
                    "x-api-key": process.env.CLIPDROP_API,
                    "Content-Type": "application/json"
                },
                responseType: "arraybuffer",
                timeout: 90000,
                maxContentLength: 15 * 1024 * 1024
            }
        );

        const imageBase64 = Buffer.from(imageResponse.data).toString("base64");
        const contentType = imageResponse.headers["content-type"] || "image/png";
        const resultImage = `data:${contentType};base64,${imageBase64}`;

        // Atomic conditional decrement prevents concurrent requests from taking credits below zero.
        const updatedUser = await userModel.findOneAndUpdate(
            { _id: req.user._id, credits: { $gte: 1 } },
            { $inc: { credits: -1 } },
            { new: true }
        ).select("credits");

        if (!updatedUser) {
            return res.status(402).json({
                success: false,
                message: "Insufficient credits",
                error: "You need at least 1 credit to generate an image"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Image generated successfully",
            resultImage,
            creditsRemaining: updatedUser.credits
        });
    } catch (error) {
        console.error("Image generation error:", error.response?.status || error.message);
        if (error.response?.status === 401) {
            return res.status(502).json({ success: false, message: "Image generation provider rejected the API credentials" });
        }
        if (error.response?.status === 400) {
            return res.status(400).json({ success: false, message: "The image provider rejected this prompt" });
        }
        if (error.code === "ECONNABORTED") {
            return res.status(504).json({ success: false, message: "Image generation timed out. Please try again." });
        }
        return res.status(502).json({
            success: false,
            message: "Failed to generate image",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

export { generateImage };
