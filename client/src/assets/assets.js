import logo from '../../assets/logo.svg';
import logo_icon from '../../assets/logo_icon.svg';
import facebook_icon from '../../assets/facebook_icon.svg';
import instagram_icon from '../../assets/instagram_icon.svg';
import twitter_icon from '../../assets/twitter_icon.svg';
import star_icon from '../../assets/star_icon.svg';
import rating_star from '../../assets/rating_star.svg';
import sample_img_1 from '../../assets/sample_img_1.png';
import sample_img_2 from '../../assets/sample_img_2.png';
import email_icon from '../../assets/email_icon.svg';
import lock_icon from '../../assets/lock_icon.svg';
import cross_icon from '../../assets/cross_icon.svg';
import star_group from '../../assets/star_group.png';
import credit_star from '../../assets/credit_star.svg';
import profile_icon from '../../assets/profile_icon.png';

// Icons
export { star_icon, star_group };

// Sample Images
export { sample_img_1, sample_img_2 };

// Testimonials Data
export const testimonialsData = [
  {
    id: 1,
    name: 'John Doe',
    role: 'Digital Artist',
    content: 'This tool has completely transformed my creative process. The quality of the generated images is simply amazing!',
    rating: 5,
    avatar: 'JD'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    role: 'Content Creator',
    content: 'I use this for all my social media content now. It saves me hours of design work every week.',
    rating: 5,
    avatar: 'SJ'
  },
  {
    id: 3,
    name: 'Mike Chen',
    role: 'Marketing Director',
    content: 'The perfect tool for quick marketing materials. The results are professional and eye-catching.',
    rating: 4,
    avatar: 'MC'
  }
];

// Steps Data
export const stepsData = [
  {
    id: 1,
    title: 'Describe Your Vision',
    description: 'Enter a detailed description of the image you want to generate. Be as specific as possible for the best results.',
    icon: '✍️'
  },
  {
    id: 2,
    title: 'Choose Style',
    description: 'Select from various artistic styles to match your creative vision and brand identity.',
    icon: '🎨'
  },
  {
    id: 3,
    title: 'Generate & Refine',
    description: 'Generate your image and use our editing tools to perfect it until it matches your vision.',
    icon: '✨'
  }
];

// Pricing Plans
export const plans = [
  {
    id: 1,
    name: 'Starter',
    price: 9.99,
    credits: 50,
    features: [
      '50 image generations',
      'Basic styles',
      'Standard resolution',
      'Email support'
    ],
    popular: false
  },
  {
    id: 2,
    name: 'Pro',
    price: 24.99,
    credits: 150,
    features: [
      '150 image generations',
      'All styles',
      'High resolution',
      'Priority support',
      'Commercial license'
    ],
    popular: true
  },
  {
    id: 3,
    name: 'Agency',
    price: 49.99,
    credits: 400,
    features: [
      '400 image generations',
      'All styles',
      'Ultra HD resolution',
      '24/7 support',
      'Commercial license',
      'API access'
    ],
    popular: false
  }
];

export const assets = {
  logo,
  logo_icon,
  facebook_icon,
  instagram_icon,
  twitter_icon,
  star_icon,
  star_group,
  rating_star,
  sample_img_1,
  sample_img_2,
  email_icon,
  lock_icon,
  cross_icon,
  credit_star,
  profile_icon,
  testimonialsData,
  stepsData,
  plans
};
