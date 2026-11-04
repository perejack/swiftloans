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

      if (user) {
        // Try to get profile balance
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('account_balance')
          .eq('auth_id', user.id)
          .maybeSingle();

        // Save loan application
        await supabase
          .from('loan_applications')
          .insert([
            {
              user_id: user.id,
              loan_amount: amount,
              loan_purpose: purpose,
              repayment_period: period,
              savings_fee: fee,
              status: 'approved',
              created_at: new Date().toISOString()
            }
          ]);

        // Update user's account balance
        const newBalance = (profile?.account_balance || 0) + amount;
        await supabase
          .from('user_profiles')
          .upsert({ 
            auth_id: user.id, 
            account_balance: newBalance,
            updated_at: new Date().toISOString()
          });
      }

      // Store in localStorage as well
      localStorage.setItem('swiftloans_active_loan', JSON.stringify({
        amount,
        purpose,
        period,
        fee,
        approvedAt: new Date().toISOString()
      }));

      setShowProcessing(true);
    } catch (error) {
      console.warn('Loan processing warning (proceeding anyway):', error);
      setShowProcessing(true);
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