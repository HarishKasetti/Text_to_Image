import React from 'react';
import { motion } from 'framer-motion';

const Steps = () => {
    const steps = [
        {
            title: 'Describe Your Vision',
            description: 'Type in a detailed description of the image you want to generate. The more specific you are, the better the results!',
            icon: '✍️',
            image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=500&auto=format&fit=crop&q=60'
        },
        {
            title: 'Choose Your Style',
            description: 'Select from various art styles like digital art, watercolor, oil painting, or let the AI surprise you!',
            icon: '🎨',
            image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&auto=format&fit=crop&q=60'
        },
        {
            title: 'Generate & Refine',
            description: 'Click generate and watch as our AI brings your vision to life. Tweak the results with additional prompts if needed.',
            icon: '⚡',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60'
        },
        {
            title: 'Download & Share',
            description: 'Download your creation in high resolution or share it directly to social media with one click.',
            icon: '💾',
            image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60'
        }
    ];

    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        How It Works
                    </h2>
                    <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
                        Create stunning AI-generated images in just a few simple steps
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 0.6,
                                delay: index * 0.1,
                                type: 'spring',
                                stiffness: 100
                            }}
                            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="h-40 bg-gray-100 overflow-hidden">
                                <img
                                    src={step.image}
                                    alt={step.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <div className="p-6">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl mb-4">
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600">
                                    {step.description}
                                </p>
                                <div className="mt-4 text-sm font-medium text-blue-600">
                                    Step {index + 1}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white overflow-hidden relative"
                >
                    <div className="relative z-10 max-w-3xl mx-auto text-center">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">
                            Ready to create amazing images?
                        </h3>
                        <p className="text-blue-100 mb-6 text-lg">
                            Join thousands of creators who are already using our AI to bring their ideas to life.
                        </p>
                        <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105">
                            Get Started for Free
                        </button>
                    </div>
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white bg-opacity-10 rounded-full"></div>
                    <div className="absolute -top-20 -left-20 w-80 h-80 bg-white bg-opacity-5 rounded-full"></div>
                </motion.div>
            </div>
        </section>
    );
};

export default Steps;