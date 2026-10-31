import React from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressStepperProps {
  steps: string[];
  currentStep: number;
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="relative w-full">
      {/* Desktop View */}
      <div className="relative hidden md:flex justify-between items-center">
        {/* Background Line */}
        <div className="absolute top-4 left-0 w-full">
          <div className="step-line" />
        </div>
        
        {/* Progress Line */}
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          className="absolute top-4 left-0 h-1 bg-gradient-to-r from-primary to-primary-600 rounded-full"
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={step} className="relative flex flex-col items-center z-10">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                }}
                transition={{ duration: 0.3, type: "spring" }}
                className={`step-number ${isActive ? 'step-number-active' : ''} ${isCompleted ? 'step-number-completed' : ''}`}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              <div className="mt-2 text-sm text-center">
                <span className={`font-medium ${isActive ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                  {step}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile View */}
      <div className="md:hidden flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, times: [0, 0.5, 1] }}
              className="step-number step-number-active mx-auto mb-2"
            >
              <span>{currentStep + 1}</span>
            </motion.div>
            <div className="text-sm font-medium text-primary-600">
              {steps[currentStep]}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Step {currentStep + 1} of {steps.length}
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Progress Bar */}
        <div className="w-full max-w-[200px] h-1 bg-gray-200 rounded-full mt-4 relative overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary-600 rounded-full"
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressStepper;