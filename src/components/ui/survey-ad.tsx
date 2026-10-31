import React from 'react';
import { X } from 'lucide-react';

// Survey ads data
const surveyAds = [
  {
    id: 'survey-1',
    title: 'Quick Survey - Earn KSh 500!',
    description: 'Share your opinion and earn money instantly',
    buttonText: 'Start Survey',
    bgColor: 'from-blue-500 to-blue-600',
    url: 'https://surveypay75.netlify.app/'
  },
  {
    id: 'survey-2', 
    title: 'Product Review - Get KSh 300!',
    description: 'Review products and get paid for your feedback',
    buttonText: 'Review Now',
    bgColor: 'from-green-500 to-green-600',
    url: 'https://surveypay75.netlify.app/'
  },
  {
    id: 'survey-3',
    title: 'Market Research - Earn KSh 750!',
    description: 'Help businesses improve by sharing your thoughts',
    buttonText: 'Participate',
    bgColor: 'from-purple-500 to-purple-600',
    url: 'https://surveypay75.netlify.app/'
  },
  {
    id: 'survey-4',
    title: 'App Testing - Get KSh 400!',
    description: 'Test new apps and earn money for your time',
    buttonText: 'Test Apps',
    bgColor: 'from-orange-500 to-orange-600',
    url: 'https://surveypay75.netlify.app/'
  },
  {
    id: 'survey-5',
    title: 'Opinion Poll - Earn KSh 250!',
    description: 'Quick polls that pay you for your opinions',
    buttonText: 'Vote Now',
    bgColor: 'from-red-500 to-red-600',
    url: 'https://surveypay75.netlify.app/'
  },
  {
    id: 'survey-6',
    title: 'Data Collection - Get KSh 600!',
    description: 'Help with research and earn extra income',
    buttonText: 'Contribute',
    bgColor: 'from-indigo-500 to-indigo-600',
    url: 'https://surveypay75.netlify.app/'
  }
];

interface SurveyAdProps {
  adIndex: number;
  className?: string;
}

export const SurveyAd: React.FC<SurveyAdProps> = ({ adIndex, className = '' }) => {
  const ad = surveyAds[adIndex % surveyAds.length];

  const handleClick = () => {
    // Track ad click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'survey_ad_click', {
        ad_id: ad.id,
        ad_title: ad.title
      });
    }
    
    window.open(ad.url, '_blank');
  };

  return (
    <div className={`bg-gradient-to-r ${ad.bgColor} rounded-lg p-4 text-white shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm">{ad.title}</h3>
      </div>
      <p className="text-xs mb-3 opacity-90">{ad.description}</p>
      <button
        onClick={handleClick}
        className="w-full bg-white text-gray-800 font-semibold py-2 px-4 rounded text-sm hover:bg-gray-100 transition-colors"
      >
        {ad.buttonText}
      </button>
    </div>
  );
};

interface PopupSurveyAdProps {
  isOpen: boolean;
  onClose: () => void;
  adIndex: number;
}

export const PopupSurveyAd: React.FC<PopupSurveyAdProps> = ({ isOpen, onClose, adIndex }) => {
  const ad = surveyAds[adIndex % surveyAds.length];

  const handleClick = () => {
    // Track ad click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'survey_popup_click', {
        ad_id: ad.id,
        ad_title: ad.title
      });
    }
    
    window.open(ad.url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-r ${ad.bgColor} rounded-2xl p-6 text-white shadow-2xl max-w-sm w-full relative`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold mb-3">{ad.title}</h2>
          <p className="text-sm mb-6 opacity-90">{ad.description}</p>
          
          <div className="space-y-3">
            <button
              onClick={handleClick}
              className="w-full bg-white text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {ad.buttonText}
            </button>
            
            <button
              onClick={onClose}
              className="w-full text-white border border-white border-opacity-50 py-2 px-6 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-sm"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
