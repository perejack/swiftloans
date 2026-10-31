import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PersonalDetails from './PersonalDetails';
import LoanOffer from './LoanOffer';
import { LoanProcessingModal } from './LoanProcessingModal';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface LoanApplicationProps {
}

const LoanApplication: React.FC<LoanApplicationProps> = () => {
  const [step, setStep] = useState(1);
  const [showProcessing, setShowProcessing] = useState(false);
  const navigate = useNavigate();
  const [loanApplication, setLoanApplication] = useState({
    amount: 0,
    purpose: '',
    period: 1,
    savings_fee: 0
  });

  const handlePersonalDetailsComplete = () => {
    setStep(2);
  };

  const handleLoanOfferComplete = async (amount: number, purpose: string, period: number, fee: number) => {
    setLoanApplication({
      amount,
      purpose,
      period,
      savings_fee: fee
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // First, ensure user profile exists and get current balance
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('account_balance')
        .eq('auth_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Save loan application
      const { error: loanError } = await supabase
        .from('loan_applications')
        .insert([
          {
            user_id: user.id,
            loan_amount: amount,
            loan_purpose: purpose,
            repayment_period: period,
            savings_fee: fee,
            status: 'approved', // Auto-approve for demo
            created_at: new Date().toISOString()
          }
        ]);

      if (loanError) throw loanError;

      // Update user's account balance
      const newBalance = (profile?.account_balance || 0) + amount;
      const { error: balanceError } = await supabase
        .from('user_profiles')
        .update({ account_balance: newBalance })
        .eq('auth_id', user.id);

      if (balanceError) throw balanceError;

      setShowProcessing(true);
    } catch (error) {
      console.error('Error saving loan application:', error);
      toast.error('Failed to process loan application. Please try again.');
    }
  };

  const handleProcessingComplete = () => {
    setShowProcessing(false);
    navigate('/loan-approved', { 
      state: { 
        amount: loanApplication.amount,
        period: loanApplication.period
      } 
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="personal-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PersonalDetails onNext={handlePersonalDetailsComplete} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div
            key="loan-offer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <LoanOffer onNext={handleLoanOfferComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {showProcessing && (
        <LoanProcessingModal
          loanAmount={loanApplication.amount}
          repaymentPeriod={loanApplication.period}
          onComplete={handleProcessingComplete}
        />
      )}
    </div>
  );
};

export default LoanApplication;