import axios from 'axios';
import mongoose from 'mongoose';
import userModel from '../models/userModel.js';

const generateImage = async (req, res) => {
    // Start a transaction to ensure atomic credit update
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { prompt } = req.body;
        
        // Validate request
        if (!prompt) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Prompt is required",
                error: "Please provide a prompt for image generation"
            });
        }

        // Get user from auth middleware
        const user = req.user;
        console.log('User object from auth:', user);
        
        if (!user) {
            await session.abortTransaction();
            session.endSession();
            console.error('No user found in request:', req);
            return res.status(404).json({
                message: "User not found",
                error: "No user information found in request"
            });
        }

        // Check if user object is valid
        if (!user._id) {
            await session.abortTransaction();
            session.endSession();
            console.error('Invalid user object:', user);
            return res.status(404).json({
                message: "Invalid user data",
                error: "User object is missing required information"
            });
        }

        // Log current credits
        console.log('Current user credits:', user.credits);

        // Check if user has enough credits
        if (user.credits < 1) {
            await session.abortTransaction();
            session.endSession();
            return res.status(402).json({
                message: "Insufficient credits",
                error: "You need at least 1 credit to generate an image"
            });
        }


        // Call Clipdrop API
        const clipdropApiKey = process.env.CLIPDROP_API;
        
        if (!clipdropApiKey) {
            await session.abortTransaction();
            session.endSession();
            console.error('CLIPDROP_API environment variable is not set');
            return res.status(500).json({
                message: "Server configuration error",
                error: "Image generation service is not properly configured"
            });
        }

        console.log('Calling Clipdrop API with prompt:', prompt);
        
        try {
            const response = await axios.post(
                'https://clipdrop-api.co/text-to-image/v1',
                {
                    prompt: prompt
                },
                {
                    headers: {
                        'x-api-key': clipdropApiKey,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer'  // Important for binary responses
                }
            );

            // Verify successful API response
            if (!response.data) {
                throw new Error('No data received from Clipdrop API');
            }

            // Process the image response
            const imageBase64 = Buffer.from(response.data, 'binary').toString('base64');
            const resultImage = `data:image/png;base64,${imageBase64}`;
            console.log('Successfully processed image from Clipdrop');

            // Get user's current credits
            const currentCredits = user.credits;
            console.log('Current credits before update:', currentCredits);

            // Update user credits and get the updated document
            const updatedUser = await userModel.findByIdAndUpdate(
                user._id,
                { $inc: { credits: -1 } },
                { new: true, session }
            ).exec();

            if (!updatedUser) {
                throw new Error('User not found');
            }

            console.log('Updated credits:', updatedUser.credits);

            // Verify credit was decremented
            if (updatedUser.credits !== currentCredits - 1) {
                throw new Error('Credit update failed');
            }

            // Commit transaction
            await session.commitTransaction();
            session.endSession();

            console.log('Image generated successfully. Credits remaining:', updatedUser.credits);
            
            // Return the generated image with updated credits
            return res.status(200).json({
                message: "Image generated successfully",
                resultImage: resultImage,
                creditsRemaining: updatedUser.credits
            });

        } catch (error) {
            // Abort transaction on error
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            if (session) {
                session.endSession();
            }
            
            console.error('Error in image generation:', error);
            
            // Handle specific error cases
            if (error.response) {
                console.error('API Error:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
                
                if (error.response.status === 401) {
                    return res.status(401).json({
                        message: "Unauthorized",
                        error: "Invalid Clipdrop API key"
                    });
                }
                
                if (error.response.status === 400) {
                    return res.status(400).json({
                        message: "Invalid request",
                        error: error.response.data?.error || "Invalid request format"
                    });
                }
            }
            
            return res.status(500).json({
                message: "Failed to generate image",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    } catch (error) {
        // This is a fallback error handler for any uncaught errors
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        if (session) {
            session.endSession();
        }
        
        console.error('Unexpected error in generateImage controller:', error);
        
        return res.status(500).json({
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
};

export { generateImage };