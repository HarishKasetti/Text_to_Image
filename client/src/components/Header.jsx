import React, { useContext } from 'react';
import { assets } from '../assets/assets.js';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Header = () => {
    const navigate=useNavigate();
    const {user,setShLogin}=useContext(AppContext)
    const onClickHandler=()=>{
        if(user){
            navigate('/result')
        }
        else{
            setShLogin(true)
        }
    }
  return (
    <motion.div className='flex flex-col items-center justify-between text-center my-20' 
    initial={{opacity:0.2,y:100}}
    whileInView={{opacity:1,y:0}}
    transition={{duration:1}}
    viewport={{once:true}}
    >
      <motion.div
      initial={{opacity:0,y:-20}}
      animate={{opacity:1,y:0}}
      transition={{delay:0.2,duration:0.8}}
       className='text-stone-500 inline-flex items-center justify-center gap-2 bg-white px-6 py-1 rounded-full border border-neutral-500'>
        <p>Best text to image generator</p>
        <img src={assets.star_icon} alt="Star Icon" className="w-5 h-5" />
      </motion.div>
      <motion.h1
      initial={{opacity:0}}
      animate={{opacity:1}}
      transition={{delay:0.4,duration:2}}
      className='text-4xl max-w-[300px] sm:text-7xl sm:max-w-[590px] mx-auto mt-10 text-center'>Turn text to  <span className='text-blue-600'>image</span>,in seconds.</motion.h1>
      <motion.p
      initial={{opacity:0,y:20}}
      animate={{opacity:1,y:0}}
      transition={{delay:0.6,duration:0.8}}
      className='text-center max-w-xl mx-auto mt-5'>Unleash your creativity with our advanced AI-powered text-to-image generator.Turn your ideas into stunning visuals with just a few clicks.</motion.p>
      <motion.button 
        onClick={onClickHandler}
        whileHover={{scale:1.05}}
        whileTap={{scale:0.95}}
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{
          default: {duration: 0.5},
          opacity: {delay: 0.8, duration: 1}
        }}
        className='sm:text-lg text-white bg-black w-auto mt-8 px-12 py-2.5 flex items-center gap-2 rounded-full hover:bg-gray-900 transition-colors'>
        Generate Images
        <img 
          className='h-6 w-6' 
          src={assets.star_group} 
          alt="Star Group" 
        />
      </motion.button>

      <motion.div
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{delay:1,duration:1}}
        className='flex flex-wrap justify-center mt-16 gap-3 max-w-4xl mx-auto'>
        {[assets.sample_img_1, assets.sample_img_2, assets.sample_img_1, assets.sample_img_2, assets.sample_img_1, assets.sample_img_2].map((img,index)=>({item: img, index})).map(({item, index})=>(
          <motion.div 
            key={index}
            className="overflow-hidden rounded-lg shadow-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
              <img 
                src={item}
                alt={`Sample image ${index + 1}`}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover"
                loading="lazy"
              />
            </motion.div>
        ))}
      </motion.div>
      <motion.p
      initial={{opacity:0}}
      animate={{opacity:1}}
      transition={{delay:1.2,duration:0.8}}
      className='mt-2 text-neutral-600'>Generated Images from Imagify</motion.p>
    </motion.div>
  )
}

export default Header