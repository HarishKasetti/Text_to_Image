import React from 'react';
import { motion } from 'framer-motion';

const Description = () => {
    const features = [
        {
            title: 'AI-Powered Image Generation',
            description: 'Transform your text descriptions into stunning, high-quality images with our advanced AI technology.',
            image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&auto=format&fit=crop&q=60',
            alt: 'AI generated art example'
        },
        {
            title: 'Multiple Art Styles',
            description: 'Choose from various art styles including realistic, digital art, watercolor, and more to match your vision.',
            image: 'https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=500&auto=format&fit=crop&q=60',
            alt: 'Art style examples'
        },
        {
            title: 'Fast & Easy',
            description: 'Generate beautiful images in seconds with our simple and intuitive interface.',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60',
            alt: 'Fast generation process'
        }
    ];

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Create Stunning AI-Generated Images
                    </h2>
                    <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                        Turn your imagination into reality with our powerful AI image generation platform.
                    </p>
                </motion.div>

                <div className="space-y-16">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 0.6,
                                delay: index * 0.2,
                                type: 'spring',
                                stiffness: 100
                            }}
                            className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12`}
                        >
                            <div className="w-full md:w-1/2">
                                <div className="rounded-xl overflow-hidden shadow-lg">
                                    <img
                                        src={feature.image}
                                        alt={feature.alt}
                                        className="w-full h-auto object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-1/2">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Description;
