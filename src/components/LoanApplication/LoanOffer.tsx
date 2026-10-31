import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface LoanOfferProps {
  onNext: (amount: number, purpose: string, period: number, fee: number) => void;
}

const loanOptions = [
  { amount: 5000, savingsDeposit: 150 },
  { amount: 7000, savingsDeposit: 200 },
  { amount: 10000, savingsDeposit: 250 },
  { amount: 14000, savingsDeposit: 300 },
  { amount: 16000, savingsDeposit: 350 },
  { amount: 19000, savingsDeposit: 400 },
  { amount: 22000, savingsDeposit: 450 },
  { amount: 25000, savingsDeposit: 500 }
];

const INTEREST_RATE = 0.10; // 10% interest rate
const loanPurposes = [
  'Business',
  'Education',
  'Medical',
  'Home Improvement',
  'Other'
];

const repaymentPeriods = [
  { months: 1, label: '1 Month' },
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 12, label: '12 Months' }
];

const LoanOffer: React.FC<LoanOfferProps> = ({ onNext }) => {
  const [selectedAmount, setSelectedAmount] = useState(loanOptions[0].amount);
  const [selectedPurpose, setSelectedPurpose] = useState(loanPurposes[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(repaymentPeriods[2].months);
  const selectedOption = loanOptions.find(option => option.amount === selectedAmount) || loanOptions[0];

  // Calculate interest and total repayment
  const interestAmount = selectedAmount * INTEREST_RATE;
  const totalRepayment = selectedAmount + interestAmount;

  const handleNext = () => {
    if (selectedOption) {
      onNext(selectedAmount, selectedPurpose, selectedPeriod, selectedOption.savingsDeposit);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-2xl font-semibold mb-6">Choose Your Loan Amount</h2>
        
        <div className="space-y-6">
          {/* Loan Amount Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Select Loan Amount
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {loanOptions.map((option) => (
                <button
                  key={option.amount}
                  onClick={() => setSelectedAmount(option.amount)}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    selectedAmount === option.amount
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-200'
                  }`}
                >
                  <div className="font-semibold">KES {option.amount.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">
                    Savings: KES {option.savingsDeposit}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Loan Purpose Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Loan Purpose
            </label>
            <select
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            >
              {loanPurposes.map((purpose) => (
                <option key={purpose} value={purpose}>
                  {purpose}
                </option>
              ))}
            </select>
          </div>

          {/* Repayment Period Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Repayment Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
            >
              {repaymentPeriods.map((period) => (
                <option key={period.months} value={period.months}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {/* Loan Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Loan Amount:</span>
              <span className="font-semibold">KES {selectedAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Interest ({(INTEREST_RATE * 100)}%):</span>
              <span className="font-semibold">KES {interestAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Repayment:</span>
              <span className="font-semibold">KES {totalRepayment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Monthly Payment:</span>
              <span className="font-semibold">
                KES {(totalRepayment / selectedPeriod).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Required Savings Deposit:</span>
              <span className="font-semibold">
                KES {selectedOption.savingsDeposit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <button
            onClick={handleNext}
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LoanOffer;