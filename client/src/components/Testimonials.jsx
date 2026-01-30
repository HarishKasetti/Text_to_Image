import React from "react";
import { testimonialsData } from "../assets/assets.js";
import { motion } from "framer-motion";

const Testimonials = () => {
    const renderStars = (rating) => {
        return Array(5).fill(0).map((_, i) => (
            <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
                {i < rating ? '★' : '☆'}
            </span>
        ));
    };

    return (
        <motion.div
            initial={{opacity: 0, y: 100}}
            whileInView={{opacity: 1, y: 0}}
            transition={{duration: 1}}
            viewport={{once: true}}
            className='w-full py-16 bg-gray-50'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                <motion.h1
                    initial={{opacity: 0, y: -20}}
                    whileInView={{opacity: 1, y: 0}}
                    transition={{delay: 0.2, duration: 0.8}}
                    className='text-3xl sm:text-4xl font-semibold mb-3 text-center text-gray-800'>
                    What Our Users Say
                </motion.h1>
                <motion.p
                    initial={{opacity: 0, y: 20}}
                    whileInView={{opacity: 1, y: 0}}
                    transition={{delay: 0.3, duration: 0.8}}
                    className='text-lg text-gray-600 mb-12 max-w-2xl mx-auto text-center px-4'>
                    Don't just take our word for it. Here's what our users have to say about their experience.
                </motion.p>
                
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {testimonialsData.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{opacity: 0, y: 30}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: true}}
                            transition={{
                                delay: 0.1 * index,
                                duration: 0.5,
                                type: 'spring',
                                stiffness: 100
                            }}
                            className='bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full border border-gray-100'>
                            
                            <div className='flex-grow'>
                                <p className='text-gray-600 mb-6 italic'>"{testimonial.content}"</p>
                            </div>
                            
                            <div className='mt-auto pt-4 border-t border-gray-100'>
                                <div className='flex items-center'>
                                    <div className='w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-4'>
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <h3 className='font-semibold text-gray-800'>{testimonial.name}</h3>
                                        <p className='text-sm text-gray-500'>{testimonial.role}</p>
                                    </div>
                                </div>
                                <div className='flex mt-3'>
                                    {renderStars(testimonial.rating)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default Testimonials;
