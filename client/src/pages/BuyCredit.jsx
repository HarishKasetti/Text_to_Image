import React, { useContext, useState } from 'react';
import { assets, plans } from '../assets/assets.js';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.onload = () => resolve(Boolean(window.Razorpay));
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const BuyCredit = () => {
  const { user, setShLogin, backendUrl, loadUserData } = useContext(AppContext);
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
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Unable to load Razorpay checkout. Please try again.');

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please log in again to continue.');

      const { data } = await axios.post(
        `${backendUrl}/api/payment/create-order`,
        { planId: plan.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success || !data.order?.id) throw new Error(data.message || 'Unable to create payment order');

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Picturize',
        description: `${data.plan.credits} credits - ${data.plan.name}`,
        order_id: data.order.id,
        image: assets.logo_icon,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#4F46E5' },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setSelectedPlan(null);
          }
        },
        handler: async (response) => {
          try {
            const verification = await axios.post(
              `${backendUrl}/api/payment/verify-payment`,
              {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!verification.data.success) throw new Error(verification.data.message || 'Payment verification failed');
            toast.success('Payment verified. Your credits have been added.');
            await loadUserData();
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.response?.data?.message || error.message || 'Payment received, but verification is pending. Please contact support before paying again.');
          } finally {
            setLoading(false);
            setSelectedPlan(null);
          }
        }
      };

      const checkout = new window.Razorpay(options);
      checkout.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);
        toast.error(response.error?.description || 'Payment failed. Please try again.');
        setLoading(false);
        setSelectedPlan(null);
      });
      checkout.open();
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error.response?.data?.message || error.message || 'Unable to start payment');
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className='border border-gray-400 inline-block px-10 py-2 rounded-full mb-6'
      >
        Our Plans
      </motion.div>

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
            key={plan.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.15, duration: 0.6, type: 'spring', stiffness: 100, damping: 15 }}
            className='bg-white drop-shadow-sm border rounded-lg py-10 px-8 text-gray-600 hover:scale-105 transition-all duration-500'
          >
            <img width={40} src={assets.logo_icon} alt="Picturize" />
            <p className='mt-3 font-semibold mb-1'>{plan.name}</p>
            <p className='text-sm'>{plan.credits} credits for image generation</p>
            <p className='mt-6'>
              <span className='text-3xl font-medium'>₹{plan.price}</span>
              <span className='text-sm'> / {plan.credits} credits</span>
            </p>
            <ul className='mt-4 space-y-2 text-sm'>
              {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
            </ul>
            <motion.button
              className={`w-full ${loading && selectedPlan === plan.id ? 'bg-gray-500' : 'bg-gray-800 hover:bg-gray-900'} text-white mt-8 text-sm py-2.5 rounded-md min-w-52`}
              whileHover={!loading ? { y: -2, scale: 1.02 } : undefined}
              disabled={loading}
              onClick={() => handlePurchase(plan)}
            >
              {loading && selectedPlan === plan.id ? 'Processing...' : (user ? 'Purchase' : 'Get Started')}
            </motion.button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default BuyCredit;
