import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ArrowRight, ArrowLeft } from 'lucide-react';

interface MpesaPaymentProps {
  onNext: () => void;
  onComplete: (transactionId: string) => Promise<void>;
  onBack: () => void;
  amount: number;
  loanAmount: number;
}

const MPESA_TILL_NUMBER = "4985580";

const MpesaPayment: React.FC<MpesaPaymentProps> = ({ onNext, onBack, onComplete, amount, loanAmount }) => {
  const [step, setStep] = useState<'instructions' | 'verification'>('instructions');
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyTillNumber = () => {
    navigator.clipboard.writeText(MPESA_TILL_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validateTransactionCode = async (code: string) => {
    // Must start with 'T' or 't' and be at least 10 characters long
    const isValid = /^[Tt].{9,}$/.test(code);
    if (!isValid) {
      setError('Invalid transaction code');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onComplete(code);
      onNext(); // Call onNext after successful completion
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Failed to verify payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">Payment Details</h2>

        {step === 'instructions' ? (
          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Payment Summary</h3>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Loan Amount:</span>
                  <span className="font-medium">KES {loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Savings Deposit:</span>
                  <span className="font-medium">KES {amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Follow these steps to complete your payment:</h3>
              <ol className="space-y-4 list-decimal list-inside text-gray-600">
                <li>Go to M-PESA on your phone</li>
                <li>Select Pay Bill</li>
                <li>
                  Enter Business Number:{' '}
                  <button
                    onClick={copyTillNumber}
                    className="inline-flex items-center text-green-600 hover:text-green-700"
                  >
                    <span className="font-medium">{MPESA_TILL_NUMBER}</span>
                    <Copy className="w-4 h-4 ml-2" />
                    {copied && (
                      <span className="ml-2 text-sm text-green-600">Copied!</span>
                    )}
                  </button>
                </li>
                <li>Enter Account Number: Your Phone Number</li>
                <li>Enter Amount: KES {amount.toLocaleString()}</li>
                <li>Enter your M-PESA PIN and confirm payment</li>
              </ol>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={onBack}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <button
                onClick={() => setStep('verification')}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Enter Transaction Code
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <label htmlFor="transaction-code" className="block text-sm font-medium text-gray-700">
                Enter M-PESA Transaction Code
              </label>
              <input
                type="text"
                id="transaction-code"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="e.g. TXN12345678"
                className={`block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2 ${
                  error
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-green-500'
                }`}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('instructions')}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Instructions
              </button>
              <button
                onClick={() => validateTransactionCode(verificationCode)}
                disabled={!verificationCode || isSubmitting}
                className={`flex items-center px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isSubmitting || !verificationCode
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                }`}
              >
                {isSubmitting ? 'Verifying...' : 'Verify Payment'}
                {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MpesaPayment;