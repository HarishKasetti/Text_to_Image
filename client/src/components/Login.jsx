import React, { useState, useContext, useEffect } from 'react';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { BeatLoader } from 'react-spinners';

const Login = () => {
    const [showLogin, setShowLogin] = useState('Login');
    const { 
        shLogin, 
        setShLogin, 
        login: contextLogin,
        register: contextRegister,
        isAuthenticating
    } = useContext(AppContext);
    
    // Loading state
    const isLoading = isAuthenticating;
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    useEffect(()=>{
        document.body.style.overflow='hidden'
        return ()=>{
            document.body.style.overflow='unset'
        }
    },[])
    // Form validation
    const validateForm = () => {
        const newErrors = {};
        
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        if (showLogin !== 'Login' && !name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        if (showLogin !== 'Login') {
            setName('');
        }
        setErrors({});
    };

    // Reset form when switching between login/signup
    useEffect(() => {
        resetForm();
    }, [showLogin]);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Clear any previous errors
        setErrors({});
        
        try {
            let result;
            
            if (showLogin === 'Login') {
                result = await contextLogin(email, password);
            } else {
                result = await contextRegister(name, email, password);
            }
            
            if (result.success) {
                // Show success message
                toast.success(
                    showLogin === 'Login' 
                        ? 'Successfully logged in!'
                        : 'Account created successfully!',
                    { autoClose: 2000 }
                );
                
                // Close the login modal
                setShLogin(false);
                resetForm();
            } else {
                // Handle errors from the API
                if (result.errors) {
                    // Handle validation errors
                    const serverErrors = {};
                    Object.entries(result.errors).forEach(([field, message]) => {
                        serverErrors[field] = Array.isArray(message) ? message[0] : message;
                    });
                    setErrors(serverErrors);
                } else if (result.message) {
                    // Handle other error messages
                    toast.error(result.message);
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            toast.error('An unexpected error occurred. Please try again.');
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }} 
            className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm'
            onClick={(e) => e.target === e.currentTarget && setShLogin(false)}
        >
            <motion.form 
                onSubmit={onSubmitHandler}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='relative w-full max-w-md bg-white rounded-2xl p-8 shadow-xl overflow-hidden'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type='button'
                    onClick={() => setShLogin(false)}
                    className='absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors'
                    disabled={isLoading}
                >
                    <img 
                        src={assets.cross_icon} 
                        className='w-6 h-6' 
                        alt='Close' 
                    />
                </button>

                {/* Header */}
                <div className='text-center mb-8'>
                    <h2 className='text-2xl font-bold text-gray-900 mb-1'>
                        {showLogin === 'Login' ? 'Welcome back!' : 'Create an account'}
                    </h2>
                    <p className='text-gray-600 text-sm'>
                        {showLogin === 'Login' 
                            ? 'Sign in to continue to Picturize' 
                            : 'Join us to start creating amazing images'}
                    </p>
                </div>

                {/* Form Fields */}
                <div className='space-y-4'>
                    {showLogin !== 'Login' && (
                        <div className='space-y-1'>
                            <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors ${
                                errors.name ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                            }`}>
                                <img className='w-5 h-5 text-gray-400' src={assets.profile_icon} alt='' />
                                <input
                                    type='text'
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder='Full Name'
                                    className='w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent'
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.name && (
                                <p className='text-red-500 text-xs mt-1 pl-1'>{errors.name}</p>
                            )}
                        </div>
                    )}

                    <div className='space-y-1'>
                        <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors ${
                            errors.email ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <img className='w-5 h-5 text-gray-400' src={assets.email_icon} alt='' />
                            <input
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='Email Address'
                                className='w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent'
                                disabled={isLoading}
                            />
                        </div>
                        {errors.email && (
                            <p className='text-red-500 text-xs mt-1 pl-1'>{errors.email}</p>
                        )}
                    </div>

                    <div className='space-y-1'>
                        <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-colors ${
                            errors.password ? 'border-red-500' : 'border-gray-200 hover:border-gray-300'
                        }`}>
                            <img className='w-5 h-5 text-gray-400' src={assets.lock_icon} alt='' />
                            <input
                                type='password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder='Password'
                                className='w-full outline-none text-gray-700 placeholder-gray-400 bg-transparent'
                                disabled={isLoading}
                            />
                        </div>
                        {errors.password && (
                            <p className='text-red-500 text-xs mt-1 pl-1'>{errors.password}</p>
                        )}
                    </div>

                    {showLogin === 'Login' && (
                        <div className='flex justify-end'>
                            <button
                                type='button'
                                className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                                onClick={() => {
                                    // Handle forgot password
                                    toast.info('Please contact support to reset your password');
                                }}
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    <button
                        type='submit'
                        disabled={isLoading}
                        className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-colors ${
                            isLoading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isLoading ? (
                            <div className='flex items-center justify-center'>
                                <BeatLoader size={8} color='white' />
                            </div>
                        ) : showLogin === 'Login' ? (
                            'Sign In'
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </div>

                {/* Toggle between Login/Signup */}
                <div className='mt-6 text-center text-sm text-gray-600'>
                    {showLogin === 'Login' ? (
                        <p>
                            Don't have an account?{' '}
                            <button
                                type='button'
                                onClick={() => setShowLogin('Sign Up')}
                                className='font-medium text-blue-600 hover:text-blue-700'
                                disabled={isLoading}
                            >
                                Sign up
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <button
                                type='button'
                                onClick={() => setShowLogin('Login')}
                                className='font-medium text-blue-600 hover:text-blue-700'
                                disabled={isLoading}
                            >
                                Sign in
                            </button>
                        </p>
                    )}
                </div>
            </motion.form>
        </motion.div>
    )
}
export default Login
