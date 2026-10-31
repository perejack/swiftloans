import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoanProcessingModalProps {
  loanAmount: number;
  repaymentPeriod: number;
  onComplete: () => void;
}

export const LoanProcessingModal: React.FC<LoanProcessingModalProps> = ({
  loanAmount,
  repaymentPeriod,
  onComplete
}) => {
  const [step, setStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const steps = [
    'Verifying application',
    'Processing loan',
    'Preparing disbursement',
    'Finalizing transfer'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(timer);
        setTimeout(() => {
          setShowSuccess(true);
          // Trigger confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          setTimeout(onComplete, 3000);
        }, 1000);
        return prev;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative overflow-hidden"
      >
        {!showSuccess ? (
          <>
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full border-4 border-green-500 border-t-transparent"
              />
            </div>
            <div className="space-y-6">
              {steps.map((text, index) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ 
                    opacity: index <= step ? 1 : 0.5,
                    x: 0
                  }}
                  className="flex items-center space-x-3"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center
                    ${index <= step ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {index < step ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : index === step ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    )}
                  </div>
                  <span className={index <= step ? 'text-gray-900' : 'text-gray-400'}>
                    {text}
                  </span>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-500" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Loan Approved!
            </h3>
            <p className="text-gray-600 mb-6">
              Your loan has been approved and transferred to your account
            </p>
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-gray-900">KES {loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Repayment Period:</span>
                <span className="font-bold text-gray-900">{repaymentPeriod} Month</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white 
                rounded-xl py-3 px-4 font-medium flex items-center justify-center space-x-2"
              onClick={onComplete}
            >
              <span>View Account</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
