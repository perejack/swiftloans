import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface ConfirmationProps {
  amount: number;
}

const Confirmation: React.FC<ConfirmationProps> = ({ amount }) => {
  useEffect(() => {
    // Simulate confetti effect
    const confetti = () => {
      // Implementation would go here if we had a confetti library
      console.log('Confetti!');
    };
    confetti();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto p-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center mb-8"
      >
        <CheckCircle className="w-20 h-20 text-green-500" />
      </motion.div>

      <h2 className="text-2xl font-bold text-center mb-4">
        Loan Application Successful!
      </h2>

      <div className="text-center mb-6">
        <p className="text-gray-600">
          Your loan application for{' '}
          <span className="font-semibold text-green-600">
            KES {amount.toLocaleString()}
          </span>{' '}
          has been received and is being processed.
        </p>
      </div>

      <div className="bg-green-50 p-6 rounded-xl mb-8">
        <h3 className="font-semibold text-green-800 mb-4">Next Steps</h3>
        <ul className="space-y-3 text-green-700">
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>Our team will review your application within 24 hours</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>You'll receive an SMS notification with the decision</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>If approved, the loan will be disbursed to your M-PESA account</span>
          </li>
        </ul>
      </div>

      <p className="text-sm text-center text-gray-500">
        You can check your loan status anytime in your account dashboard
      </p>
    </motion.div>
  );
};

export default Confirmation;