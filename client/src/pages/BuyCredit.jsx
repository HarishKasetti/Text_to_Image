import React, { useContext, useState } from 'react';
import { assets, plans } from '../assets/assets.js';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

// Load Razorpay script with retry mechanism
const loadRazorpay = () => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.Razorpay) {
      console.log('Razorpay already loaded');
      return resolve(true);
    }

    let attempts = 0;
    const maxAttempts = 3;

    const tryLoad = () => {
      attempts++;
      
      // Check if script is already in the DOM
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        console.log('Razorpay script already in DOM');
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => {
          if (attempts < maxAttempts) {
            console.log(`Retrying Razorpay load (${attempts}/${maxAttempts})...`);
            setTimeout(tryLoad, 1000 * attempts);
          } else {
            console.error('Failed to load Razorpay after multiple attempts');
            resolve(false);
          }
        };
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        if (window.Razorpay) {
          console.log('Razorpay loaded successfully');
          resolve(true);
        } else if (attempts < maxAttempts) {
          console.log(`Razorpay object not found, retrying (${attempts}/${maxAttempts})...`);
          setTimeout(tryLoad, 1000 * attempts);
        } else {
          console.error('Razorpay object not found after multiple attempts');
          resolve(false);
        }
      };
      
      script.onerror = () => {
        if (attempts < maxAttempts) {
          console.log(`Error loading Razorpay, retrying (${attempts}/${maxAttempts})...`);
          setTimeout(tryLoad, 1000 * attempts);
        } else {
          console.error('Failed to load Razorpay after multiple attempts');
          resolve(false);
        }
      };
      
      document.head.appendChild(script);
    };
    
    tryLoad();
  });
};

const BuyCredit = () => {
  const { user, setUser, setShLogin, backendUrl, loadUserData } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handlePurchase = async (plan) => {
    if (!user) {
      setShLogin(true);
      return;
    }

    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      // 1. Load Razorpay script
      setLoading(true);
      setSelectedPlan(plan.id);
      
      console.log('Attempting to load Razorpay...');
      const isRazorpayLoaded = await loadRazorpay();
      
      if (!isRazorpayLoaded) {
        console.error('Razorpay failed to load after multiple attempts');
        throw new Error(
          'Failed to load payment processor. Please disable any ad blockers or privacy extensions and try again.'
        );
      }
      
      if (typeof window.Razorpay === 'undefined') {
        console.error('Razorpay is not available on window object');
        throw new Error(
          'Payment processor not available. Please try refreshing the page or contact support if the issue persists.'
        );
      }

      // 2. Create order on the backend
      const { data } = await axios.post(
        `${backendUrl}/api/payment/create-order`,
        {
          amount: plan.price, // Send amount in rupees, backend will convert to paise
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          notes: {
            plan: plan.id,
            credits: plan.credits,
            userId: user.id
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!data.success) {
        throw new Error('Failed to create order');
      }

      // 3. Open Razorpay checkout
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Picturize',
        description: `${plan.credits} credits`,
        order_id: data.order.id,
        image: assets.logo_icon, // Use your logo
        handler: async function (response) {
          try {
            // Verify payment on the backend
            const verifyRes = await axios.post(
              `${backendUrl}/api/payment/verify-payment`,
              {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                planId: plan.id
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
              }
            );

            if (verifyRes.data.success) {
              toast.success('Payment successful! Credits added to your account.');
              // Force a complete refresh of user data including credits
              try {
                await loadUserData();
                // Force a re-render of the navbar by updating a dummy state
                setLoading(prev => !prev);
              } catch (error) {
                console.error('Error refreshing user data:', error);
                // Even if refresh fails, update the UI optimistically
                const updatedUser = { ...user, credits: user.credits + plan.credits };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Error verifying payment');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#4F46E5',
          hide_topbar: true, // Hide Razorpay header to avoid SVG issues
          backdrop_close: true
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setSelectedPlan(null);
          }
        },
        // Configure payment methods to avoid problematic SVGs
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Banks',
                instruments: [
                  {
                    method: 'card',
                    issuers: ['HDFC', 'ICICI', 'SBI']
                  },
                  {
                    method: 'netbanking',
                    banks: ['HDFC', 'ICICI', 'SBI']
                  }
                ]
              }
            },
            hide: [
              { 
                method: 'upi' 
              }
            ],
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: false
            }
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', function(response) {
        console.error('Payment failed:', response.error);
        toast.error('Payment failed. Please try again.');
        setLoading(false);
        setSelectedPlan(null);
      });

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Error processing payment');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.2, duration: 0.8 }} 
      viewport={{ once: true }}
      className='text-center min-h-[80vh] pt-14 mb-10'
    >
      <motion.button 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4, duration: 0.6 }}
        className='border border-gray-400 px-10 py-2 rounded-full mb-6 hover:bg-gray-100 hover:border-gray-500 transition-all duration-300'
      >
        Our Plans
      </motion.button>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.6, duration: 0.6 }}
        className='text-center text-3xl font-medium mb-6 sm:mb-10'
      >
        Choose the Plan
      </motion.h1>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.8, duration: 0.6 }}
        className='flex flex-wrap justify-center gap-6 text-left'
      >
        {plans.map((plan, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: 1 + (index * 0.2),
              duration: 0.6,
              type: 'spring',
              stiffness: 100,
              damping: 15
            }}
            className='bg-white drop-shadow-sm border rounded-lg py-12 px-8 text-gray-600 hover:scale-105 transition-all duration-500'
          >
            <motion.img 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.4 }}
              width={40} 
              src={assets.logo_icon} 
              alt="" 
            />
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className='mt-3 font-semibold mb-1'
            >
              {plan.id}
            </motion.p>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className='text-sm'
            >
              {plan.desc}
            </motion.p>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className='mt-6'
            >
              <span className='text-3xl font-medium'>${plan.price}</span> /{plan.credits} credits
            </motion.p>

            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className={`w-full ${loading && selectedPlan === plan.id ? 'bg-gray-500' : 'bg-gray-800 hover:bg-gray-900'} text-white mt-8 text-sm py-2.5 rounded-md min-w-52`}
              whileHover={!loading && {
                backgroundColor: '#4b5563',
                y: -2,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                scale: 1.02,
                transition: { duration: 0.2 }
              }}
              disabled={loading}
              onClick={() => {
                if (!user) {
                  setShLogin(true);
                } else {
                  handlePurchase(plan);
                }
              }}
            >
              {loading && selectedPlan === plan.id ? 'Processing...' : (user ? 'Purchase' : 'Get Started')}
            </motion.button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}

export default BuyCredit